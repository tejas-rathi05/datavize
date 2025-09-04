# FastAPI Backend

This is the FastAPI backend for the DataVize application, providing document processing and AI-powered question answering capabilities.

## Features

- **Document Upload**: Upload multiple documents (PDF, DOCX, TXT, etc.)
- **Document Processing**: Automatic text extraction and indexing using LangChain
- **RAG (Retrieval-Augmented Generation)**: AI-powered question answering based on uploaded documents
- **Session Management**: Each upload session gets a unique ID for document retrieval

## Setup

### 1. Install Dependencies

```bash
pip install -r requirments.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# AI Model Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true
```

### 3. Start the Backend

```bash
# Option 1: Using the startup script
python start_backend.py

# Option 2: Using uvicorn directly
cd src
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

## API Endpoints

### 1. Upload Documents
- **POST** `/upload`
- **Description**: Upload multiple documents for processing
- **Request**: Multipart form data with files
- **Response**: 
  ```json
  {
    "message": "Files uploaded successfully",
    "session_id": "uuid-string"
  }
  ```

### 2. Ask Questions
- **POST** `/ask`
- **Description**: Ask questions about uploaded documents
- **Request**:
  ```json
  {
    "question": "Your question here",
    "session_id": "optional-session-id"
  }
  ```
- **Response**:
  ```json
  {
    "answer": "AI-generated answer based on documents",
    "session_id": "session-id-used"
  }
  ```

## Architecture

### Components

1. **main.py**: FastAPI application with CORS middleware
2. **Retriever.py**: Document processing and vector store creation
3. **workflow.py**: RAG workflow implementation
4. **document_loader.py**: Document loading utilities

### Document Processing Flow

1. **Upload**: Files are uploaded and stored in session-specific folders
2. **Processing**: Documents are processed using LangChain document loaders
3. **Indexing**: Text is chunked and indexed in a vector store
4. **Retrieval**: Questions trigger semantic search over the indexed content
5. **Generation**: AI model generates answers based on retrieved context

### Session Management

- Each upload creates a unique session ID
- Session data (retriever, LLM, folder) is stored in memory
- Questions can reference a specific session or use the latest session

## Development

### File Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI application
│   ├── Retriever.py         # Document processing
│   ├── workflow.py          # RAG workflow
│   └── document_loader.py   # Document utilities
├── data/
│   └── upload/              # Uploaded files storage
├── requirments.txt          # Python dependencies
├── start_backend.py         # Startup script
└── README.md               # This file
```

### Adding New Document Types

To support new document types, update the `document_loader.py` file with appropriate LangChain loaders.

### Customizing AI Models

Modify the model configuration in `Retriever.py` to use different AI models or providers.

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all dependencies are installed and the Python path is correct
2. **CORS Issues**: The backend is configured to allow all origins for development
3. **File Upload Issues**: Check file permissions and available disk space
4. **AI Model Errors**: Verify API keys are correctly set in environment variables

### Logs

The backend provides detailed logging. Check the console output for error messages and debugging information.

## Production Deployment

For production deployment:

1. Set `RELOAD=false` in environment variables
2. Use a production ASGI server like Gunicorn with Uvicorn workers
3. Configure proper CORS origins
4. Set up proper logging and monitoring
5. Use environment variables for all sensitive configuration
