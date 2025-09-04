import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Get chat session by slug
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("slug", slug)
      .eq("user_id", user.id)
      .single();

    if (sessionError) {
      if (sessionError.code === "PGRST116") {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
      console.error("Failed to fetch chat session:", sessionError);
      return NextResponse.json({ error: "Failed to fetch chat session" }, { status: 500 });
    }

    // Create user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        id: nanoid(),
        session_id: session.id,
        role: "user",
        content: content.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userMessageError) {
      console.error("Failed to create user message:", userMessageError);
      return NextResponse.json({ error: "Failed to create user message" }, { status: 500 });
    }

    // Update session timestamp
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session.id);

    // TODO: Process with AI and generate response
    // For now, create a placeholder assistant response
    const assistantResponse = "This is a placeholder response. AI integration will be implemented here.";
    
    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from("chat_messages")
      .insert({
        id: nanoid(),
        session_id: session.id,
        role: "assistant",
        content: assistantResponse,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (assistantMessageError) {
      console.error("Failed to create assistant message:", assistantMessageError);
      return NextResponse.json({ error: "Failed to create assistant message" }, { status: 500 });
    }

    // Format the assistant message for response
    const formattedAssistantMessage = {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      timestamp: new Date(assistantMessage.created_at),
    };

    return NextResponse.json({
      assistantMessage: formattedAssistantMessage,
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
