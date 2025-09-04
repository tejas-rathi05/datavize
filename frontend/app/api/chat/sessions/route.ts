import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerSupabaseClient } from "@/lib/supabase";
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, initialMessage } = await request.json();
    
    if (!initialMessage?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Generate a unique slug
    const slug = nanoid(10);
    
    // Create chat session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        id: nanoid(),
        slug,
        title: title || "New Chat",
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Failed to create chat session:", sessionError);
      return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 });
    }

    // Create initial message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        id: nanoid(),
        session_id: session.id,
        role: "user",
        content: initialMessage,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      console.error("Failed to create initial message:", messageError);
      return NextResponse.json({ error: "Failed to create initial message" }, { status: 500 });
    }

    // TODO: Process with AI and create assistant response
    // For now, return the session with the initial message
    return NextResponse.json({
      sessionId: session.id,
      slug: session.slug,
      message: message,
    });

  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's chat sessions
    const { data: sessions, error } = await supabase
      .from("chat_sessions")
      .select(`
        id,
        slug,
        title,
        created_at,
        updated_at,
        chat_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch chat sessions:", error);
      return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 });
    }

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
