import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
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

    // Get chat session by slug
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select(`
        id,
        slug,
        title,
        created_at,
        updated_at
      `)
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

    // Get messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select(`
        id,
        role,
        content,
        created_at,
        metadata
      `)
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch chat messages:", messagesError);
      return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
    }

    // Format the response
    const formattedSession = {
      id: session.id,
      slug: session.slug,
      title: session.title,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata,
      })),
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    };

    return NextResponse.json(formattedSession);

  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get session ID first
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

    // Delete messages first (due to foreign key constraint)
    const { error: messagesDeleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("session_id", session.id);

    if (messagesDeleteError) {
      console.error("Failed to delete chat messages:", messagesDeleteError);
      return NextResponse.json({ error: "Failed to delete chat messages" }, { status: 500 });
    }

    // Delete the session
    const { error: sessionDeleteError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", session.id);

    if (sessionDeleteError) {
      console.error("Failed to delete chat session:", sessionDeleteError);
      return NextResponse.json({ error: "Failed to delete chat session" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
