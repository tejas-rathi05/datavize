"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageSquare, Calendar, Hash } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { ContentLayout } from "@/components/sidebar/content-layout";
import { cn } from "@/lib/utils";

export default function ChatListPage() {
  const router = useRouter();
  const { chats, selectChat } = useChat();

  const handleNewChat = () => {
    router.push("/chat/new");
  };

  const handleChatSelect = (chat: any) => {
    selectChat(chat.id);
    router.push(`/chat/${chat.slug}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ContentLayout 
      title="" 
      showContextToggle={true}
      contextType="chat"
      className="pt-[66px]"
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Conversations</h1>
            <p className="text-muted-foreground">
              Continue where you left off or start a new conversation
            </p>
          </div>
          <Button onClick={handleNewChat} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat Grid */}
        {chats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No chats yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your first conversation with AI. Ask questions, get help with tasks, or just chat about anything on your mind.
            </p>
            <Button onClick={handleNewChat} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chats.map((chat) => (
              <Card 
                key={chat.id} 
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleChatSelect(chat)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {chat.title}
                    </CardTitle>
                    {chat.model && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                        {chat.model}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{chat.messages.length} messages</span>
                    </div>
                    
                    {chat.messages.length > 0 && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {chat.messages[chat.messages.length - 1].content}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(chat.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Document Q&A",
                description: "Upload documents and ask questions about them",
                icon: Hash,
                prompt: "Upload documents and ask questions"
              },
              {
                title: "Brainstorm Ideas",
                description: "Generate creative ideas and solutions",
                icon: MessageSquare,
                prompt: "Brainstorm ideas for..."
              },
              {
                title: "Learn Something",
                description: "Understand complex topics in simple terms",
                icon: MessageSquare,
                prompt: "Explain..."
              }
            ].map((action, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => {
                  router.push(`/chat/new?prompt=${encodeURIComponent(action.prompt)}`);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-medium">{action.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Integration Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">📄 Document Processing Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Upload PDF, DOCX, TXT, and other document formats</li>
            <li>• Ask questions about your uploaded documents using AI</li>
            <li>• Get intelligent answers based on document content</li>
            <li>• Session-based document management</li>
          </ul>
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/test-fastapi')}
            >
              Test FastAPI Integration
            </Button>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
