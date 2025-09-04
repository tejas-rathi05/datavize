"use client";

import { useContextSidebar } from "@/hooks/use-context-sidebar";
import { useStore } from "@/hooks/use-store";
import { useChat } from "@/lib/chat-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  MessageSquare,
  FileText,
  Database,
  Settings,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function ContextSidebar() {
  const contextSidebar = useStore(useContextSidebar, (x) => x);
  const {
    chats,
    selectedChatId,
    selectChat,
    createChat,
    deleteChat,
    renameChat,
  } = useChat();
  const router = useRouter();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (!contextSidebar) return null;

  const { isOpen, contextType, closeContext } = contextSidebar;

  if (!isOpen) return null;

  const handleNewChat = () => {
    router.push("/chat/new");
    closeContext();
  };

  const handleChatSelect = (chatId: string) => {
    selectChat(chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      router.push(`/chat/${chat.slug}`);
    }
    closeContext();
  };

  const handleStartEdit = (chat: any) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = () => {
    if (editingChatId && editTitle.trim()) {
      renameChat(editingChatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(chatId);
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 h-screen w-[400px] bg-background border-l transition-transform duration-300 ease-in-out z-30",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{
        left: "var(--sidebar-width, 90px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-r">
        <div className="flex items-center gap-2 text-xl font-bold">
          {contextType === "chat" && <MessageSquare className="h-5 w-5" />}
          {contextType === "knowledge" && <Database className="h-5 w-5" />}
          {contextType === "files" && <FileText className="h-5 w-5" />}
          <h3 className="font-semibold capitalize">
            {contextType || "Context"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeContext}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-full border-r">
        <div className="p-4 space-y-4">
          {contextType === "chat" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Chat History</h4>
                <Button onClick={handleNewChat} size="sm" className="h-8 px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No chats yet
                  </p>
                  <Button onClick={handleNewChat} size="sm">
                    Start your first chat
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                        selectedChatId === chat.id
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="">
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-6 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={handleSaveEdit}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-sm">
                              {chat.title.length > 40
                                ? chat.title.slice(0, 40) + "..."
                                : chat.title}
                            </h5>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(chat);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {contextType === "knowledge" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Knowledge Base</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your knowledge base and documents.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Projects</h5>
                  <p className="text-xs text-muted-foreground">
                    Manage your knowledge projects
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Files</h5>
                  <p className="text-xs text-muted-foreground">
                    Upload and manage documents
                  </p>
                </div>
              </div>
            </div>
          )}

          {contextType === "files" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">File Manager</h4>
                <p className="text-sm text-muted-foreground">
                  Browse and manage your uploaded files.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Recent Files</h5>
                  <p className="text-xs text-muted-foreground">
                    No recent files
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">File Types</h5>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, TXT, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!contextType && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Context Sidebar</h4>
                <p className="text-sm text-muted-foreground">
                  Select a context type to view relevant information.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
