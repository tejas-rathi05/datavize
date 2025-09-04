import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the form data to FastAPI backend
    const response = await fetch(`${FASTAPI_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("FastAPI upload error:", errorData);
      return NextResponse.json(
        { error: "Failed to upload files to backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      message: data.message,
      session_id: data.session_id,
    });

  } catch (error) {
    console.error("Error in FastAPI upload integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
