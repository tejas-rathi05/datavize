import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, session_id } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Prepare the request to FastAPI /ask endpoint
    const fastapiRequest = {
      question,
      session_id: session_id || null // Use provided session_id or null for latest session
    };

    // Make request to FastAPI backend /ask endpoint
    const response = await fetch(`${FASTAPI_BASE_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastapiRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("FastAPI /ask error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      answer: data.answer,
      session_id: data.session_id,
    });

  } catch (error) {
    console.error("Error in /ask integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
