"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}

export default function ChatSessionsList() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/chat/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    router.push("/chat/new");
  };

  const handleSessionClick = (slug: string) => {
    router.push(`/chat/${slug}`);
  };

  const handleDeleteSession = async (sessionId: string, slug: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const response = await fetch(`/api/chat/sessions/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        // If we're currently in this chat, redirect to new chat
        if (pathname === `/chat/${slug}`) {
          router.push("/chat/new");
        }
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="p-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-1 p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs">Start a new conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                  pathname === `/chat/${session.slug}` && "bg-accent"
                )}
                onClick={() => handleSessionClick(session.slug)}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(session.updated_at)}
                  </p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id, session.slug);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
