from typing import List
import os
import uuid
import json
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from Retriever import Retriever
from workflow import workflow

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Find and create upload folder
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "data", "upload")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Store data for each user session
session_folder_map = {}
latest_session_id = None  # ✅ Track latest uploaded session_id

#-------- API 1: Upload Documents --------
@app.post("/upload")
async def upload_docs(files: List[UploadFile] = File(...)):
    """
    Step 1: User uploads files
    Step 2: We create a unique folder for this user (using session_id)
    Step 3: We store retriever + llm for this session
    Step 4: Return session_id to user for future requests
    """
    global latest_session_id
    
    # Create unique session_id
    session_id = str(uuid.uuid4())
    # Create unique folder for this session
    folder = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(folder, exist_ok=True)
    # Save uploaded files in this session's folder
    for file in files:
        if file.filename:
            file_path = os.path.join(folder, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
    # Create Retriever object for this session
    obj = Retriever(folder)
    retriever, llm = obj.retriever()
    # Store session data in memory
    session_folder_map[session_id] = {
        "folder": folder,
        "retriever": retriever,
        "llm": llm
    }

    # Update latest session
    latest_session_id = session_id

    return {
        "message": "Files uploaded successfully",   
        "session_id": session_id
    }


# -------- API 2: Ask Question --------
@app.post("/ask")
async def ask_question(request: Request):
    """
    Step 1: User sends question + session_id (optional)
    Step 2: We fetch retriever + llm for that session
    Step 3: Process query and return answer
    """
    global latest_session_id

    data = await request.json()
    print("data --->>>", data)

    question = data.get("question")
    session_id = data.get("session_id")

    # Fallback to latest session if not provided
    if not session_id:
        session_id = latest_session_id

    # Validate session
    session_data = session_folder_map.get(session_id)
    print("Session Data : >>",session_data)
    if not session_data:
        return {"answer": "❌ Invalid session or no documents uploaded."}

    # Process question using stored retriever + llm
    obj = workflow(
        session_data["llm"],
        question,
        session_data["retriever"],
        session_data["folder"]
    )
    answer = obj.Builder()

    return {"answer": answer, "session_id": session_id}# -------- API 3: Chat with Streaming --------
@app.post("/chat")
async def chat(request: Request):
    """
    Chat endpoint that supports streaming responses
    Handles both text messages and file attachments
    """
    try:
        data = await request.json()
        messages = data.get("messages", [])
        model = data.get("model", "gpt-4o")
        chat_id = data.get("chatId")
        stream = data.get("stream", False)
        files = data.get("files", [])
        
        if not messages:
            return {"error": "No messages provided"}
        
        # Get the last user message
        last_message = messages[-1]
        if last_message.get("role") != "user":
            return {"error": "Last message must be from user"}
        
        user_content = last_message.get("content", "")
        
        # Process files if any
        if files:
            # For now, we'll append file info to the user content
            # In a real implementation, you might want to process files differently
            file_info = "\n\nAttached files:\n"
            for file in files:
                file_info += f"- {file.get('name', 'Unknown')} ({file.get('type', 'Unknown type')})\n"
            user_content += file_info
        
        # For streaming, we'll simulate streaming by sending chunks
        if stream:
            async def generate_stream():
                # Simulate processing delay
                import asyncio
                await asyncio.sleep(0.1)
                
                # Generate response using the workflow
                # For now, we'll use a simple response, but you can integrate with your RAG system
                response_text = f"I understand you're asking: {user_content}\n\nThis is a response from your FastAPI backend. You can integrate this with your RAG system to provide more intelligent responses."
                
                # Split response into chunks for streaming effect
                words = response_text.split()
                chunk_size = 3  # Words per chunk
                
                for i in range(0, len(words), chunk_size):
                    chunk = " ".join(words[i:i + chunk_size])
                    if i + chunk_size < len(words):
                        chunk += " "  # Add space between chunks
                    
                    # Format as Server-Sent Events
                    yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk}}]})}\n\n"
                    await asyncio.sleep(0.05)  # Small delay between chunks
                
                # Send completion signal
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/plain",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # Non-streaming response
            response_text = f"I understand you're asking: {user_content}\n\nThis is a response from your FastAPI backend. You can integrate this with your RAG system to provide more intelligent responses."
            
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    }
                }],
                "model": model,
                "usage": {
                    "prompt_tokens": len(user_content.split()),
                    "completion_tokens": len(response_text.split()),
                    "total_tokens": len(user_content.split()) + len(response_text.split())
                }
            }
            
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return {"error": f"Internal server error: {str(e)}"}

