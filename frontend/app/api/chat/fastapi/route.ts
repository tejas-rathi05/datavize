import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    let messages: any[] = [];
    let model = "gpt-4o";
    let chatId: string | undefined;
    let stream = false;
    let files: any[] = [];

    // Check if the request is multipart form data
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data for file uploads
      const formData = await request.formData();
      
      const messagesData = formData.get("messages");
      if (messagesData) {
        try {
          messages = JSON.parse(messagesData as string);
        } catch (e) {
          return NextResponse.json(
            { error: "Invalid messages format" },
            { status: 400 }
          );
        }
      }

      const modelData = formData.get("model");
      if (modelData) {
        model = modelData as string;
      }

      const chatIdData = formData.get("chatId");
      if (chatIdData) {
        chatId = chatIdData as string;
      }

      const streamData = formData.get("stream");
      if (streamData) {
        stream = streamData === "true";
      }

      // Process uploaded files
      const uploadedFiles = formData.getAll("files");
      for (const file of uploadedFiles) {
        if (file instanceof File) {
          const fileBuffer = await file.arrayBuffer();
          const base64Data = Buffer.from(fileBuffer).toString('base64');
          
          files.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
          });
        }
      }
    } else {
      // Handle regular JSON requests
      const body = await request.json();
      messages = body.messages || [];
      model = body.model || "gpt-4o";
      chatId = body.chatId;
      stream = body.stream || false;
      files = body.files || [];
    }

    // Prepare the request to FastAPI backend
    const fastapiRequest = {
      messages,
      model,
      chatId,
      stream,
      files: files.map((f: any) => ({
        name: f.name,
        type: f.type,
        size: f.size
      }))
    };

    // Make request to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastapiRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("FastAPI backend error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from backend" },
        { status: response.status }
      );
    }

    // If streaming is requested, return the stream
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming requests, return JSON response
    const data = await response.json();
    
    // Extract the assistant's response
    const assistantMessage = data.choices?.[0]?.message;
    if (!assistantMessage) {
      return NextResponse.json(
        { error: "Invalid response from FastAPI backend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: assistantMessage.content,
      model: data.model,
      usage: data.usage,
      files: files.length > 0 ? files.map((f: any) => ({ name: f.name, type: f.type, size: f.size })) : []
    });

  } catch (error) {
    console.error("Error in FastAPI integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
