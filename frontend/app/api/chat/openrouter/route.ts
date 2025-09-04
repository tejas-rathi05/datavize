import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
      // Handle regular JSON requests (existing functionality)
      const body = await request.json();
      messages = body.messages || [];
      model = body.model || "gpt-4o";
      chatId = body.chatId;
      stream = body.stream || false;
      files = body.files || [];
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Process messages to include file content
    const processedMessages = messages.map((msg: any) => {
      if (msg.role === "user" && files.length > 0) {
        // Create a comprehensive message that includes file information
        let fileContent = "";
        
        files.forEach((file: any) => {
          fileContent += `\n\n**File: ${file.name}**\n`;
          fileContent += `Type: ${file.type}\n`;
          fileContent += `Size: ${(file.size / 1024).toFixed(2)} KB\n`;
          
          // For text-based files, include the content
          if (file.type.startsWith('text/') || 
              file.type.includes('json') || 
              file.type.includes('xml') ||
              file.type.includes('csv')) {
            try {
              const textContent = Buffer.from(file.data, 'base64').toString('utf-8');
              fileContent += `\nContent:\n\`\`\`\n${textContent}\n\`\`\`\n`;
            } catch (e) {
              fileContent += `\nContent: Unable to read file content\n`;
            }
          } else {
            fileContent += `\nContent: Binary file (${file.type})\n`;
          }
        });

        return {
          role: msg.role,
          content: msg.content + fileContent
        };
      }
      
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Prepare the request to OpenRouter
    const openRouterRequest = {
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. When analyzing files, provide clear insights and summaries. Use markdown formatting to make your answers clear and well-structured. Use headings, lists, code blocks, tables, and other markdown elements when appropriate to organize information effectively."
        },
        ...processedMessages
      ],
      temperature: 0.7,
      max_tokens: 4000, // Increased for file processing
      stream: stream,
    };

    // Make request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Agent Chat",
      },
      body: JSON.stringify(openRouterRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from OpenRouter" },
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
        { error: "Invalid response from OpenRouter" },
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
    console.error("Error in OpenRouter API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
