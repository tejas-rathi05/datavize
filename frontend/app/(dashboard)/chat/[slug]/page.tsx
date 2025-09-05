"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useIsLoading } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from '@hugeicons/react';
import { Attachment02Icon, Copy01Icon, DatabaseIcon, ThumbsDownIcon, ThumbsUpIcon, Tick02Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import {
  Send,
  Plus,
  ArrowLeft,
  Trash2,
  Check,
  Loader2,
  Database,
  Paperclip,
  ArrowUp,
  ThumbsUp,
  ThumbsDown,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentLayout } from "@/components/sidebar/content-layout";
import { useChat } from "@/lib/chat-context";
import { EnhancedTypingIndicator } from "@/components/chat/typing-indicator";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptTextarea } from "@/components/custom-ui/prompt-text-area";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { KnowledgeBaseDialog } from "@/components/chat/knowledge-base-dialog";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const isLoading = useIsLoading();
  const {
    chats,
    getChatBySlug,
    sendMessage,
    deleteChat,
    renameChat,
    getStreamingContent,
  } = useChat();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isKnowledgeBaseDialogOpen, setIsKnowledgeBaseDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slug = params.slug as string;
  // Get chat from context state instead of getChatBySlug to ensure reactivity
  const chat = chats.find((c: any) => c.slug === slug);

  // Set loading state and redirect if chat not found
  useEffect(() => {
    if (!slug) return;

    if (!chat) {
      setLoading(false);
      router.push("/chat/new");
      return;
    }

    setLoading(false);
    setEditTitle(chat.title);
  }, [slug, chat, router]);

  // Check for initial message from new chat creation
  useEffect(() => {
    if (!chat) return;

    console.log("Chat page loaded, checking for initial message...");
    console.log("Current chat ID:", chat.id);
    console.log("Current chat messages:", chat.messages);

    const initialMessageData = sessionStorage.getItem("initialMessage");
    console.log(
      "Initial message data from sessionStorage:",
      initialMessageData
    );

    if (initialMessageData) {
      try {
        const { chatId, content, model } = JSON.parse(initialMessageData);
        console.log("Parsed initial message:", { chatId, content, model });
        console.log(
          "Comparing chatId:",
          chatId,
          "with current chat.id:",
          chat.id
        );

        // Check if this is the chat we're looking for
        if (chatId === chat.id) {
          console.log(
            "Found initial message for this chat, sending automatically"
          );

          // Remove the initial message data
          sessionStorage.removeItem("initialMessage");

          // Send the message automatically
          sendMessage(chat.id, content, model)
            .then(() => {
              console.log("Initial message sent successfully");
            })
            .catch((error) => {
              console.error("Failed to send initial message:", error);
            });
        } else {
          console.log("Chat ID mismatch, not sending initial message");
        }
      } catch (error) {
        console.error("Failed to parse initial message data:", error);
        sessionStorage.removeItem("initialMessage");
      }
    } else {
      console.log("No initial message found in sessionStorage");
    }
  }, [chat, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Global drag event listeners to handle edge cases
  useEffect(() => {
    const handleGlobalDragLeave = (e: DragEvent) => {
      // Only reset if we're leaving the window or dragging outside
      if (!e.relatedTarget || e.relatedTarget === document.body) {
        setIsDragging(false);
      }
    };

    const handleGlobalDrop = () => {
      setIsDragging(false);
    };

    document.addEventListener("dragleave", handleGlobalDragLeave);
    document.addEventListener("drop", handleGlobalDrop);

    return () => {
      document.removeEventListener("dragleave", handleGlobalDragLeave);
      document.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chat || sending) return;

    setSending(true);

    try {
      await sendMessage(chat.id, message.trim(), chat.model, attachedFiles);
      setMessage("");
      setAttachedFiles([]); // Clear attached files after sending
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    router.push("/chat/new");
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (!chat || !confirm("Are you sure you want to delete this chat?")) return;

    try {
      deleteChat(chat.id);
      router.push("/chat/new");
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleStartEditTitle = () => {
    setEditingTitle(true);
    setEditTitle(chat?.title || "");
  };

  const handleSaveTitle = () => {
    if (chat && editTitle.trim()) {
      renameChat(chat.id, editTitle.trim());
    }
    setEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(false);
    setEditTitle(chat?.title || "");
  };

  // Helper function to get display content for a message
  const getMessageDisplayContent = (msg: any) => {
    // For streaming messages, use the content field (which gets updated by pushStreamingChunk)
    if (msg.isStreaming) {
      return msg.content || "";
    }

    return msg.content || "";
  };

  // Show loading state while authentication is being restored
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only check for user after loading is complete
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to access chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chat not found</p>
      </div>
    );
  }

  return (
    <ContentLayout
      title={""}
      showContextToggle={true}
      contextType="chat"
      maxWidth="none"
      className="overflow-hidden"
    >
      <div
        className="flex flex-col overflow-hidden "
        style={{
          height: "100vh", // Full viewport height since navbar overlaps
          padding: "0",
          margin: "0",
        }}
      >
        {/* Messages Container with ScrollArea */}
        <div
          className="flex-1 relative"
          style={{ height: "100vh" }} // Full height since navbar overlaps
        >
          <ScrollArea className="h-full w-full">
            <div className="h-full min-h-screen  p-4 space-y-4 chat-messages pt-[66px] pb-60 md:max-w-5xl mx-auto shadow-xl bg-background">
              {chat.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "assistant" ? "justify-start" : "justify-end",
                    msg.isStreaming && "streaming-message"
                  )}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/ai-avatar.png" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}

                  <Card
                    className={cn(
                      "max-w-[80%] relative rounded-3xl",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground py-0 p-2"
                        : "bg-muted py-0 p-2"
                    )}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 streaming-content">
                          {msg.role === "assistant" ? (
                            <MarkdownRenderer
                              content={getMessageDisplayContent(msg)}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap streaming-text">
                              {getMessageDisplayContent(msg)}

                              {/* Display attached files */}
                              {msg.files && msg.files.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-muted/30">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Attached files:
                                  </p>
                                  <div className="space-y-2">
                                    {msg.files.map(
                                      (file: any, fileIndex: number) => (
                                        <div
                                          key={fileIndex}
                                          className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded"
                                        >
                                          <FileIcon className="w-3 h-3" />
                                          <span className="truncate">
                                            {file.name}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyMessage(
                              getMessageDisplayContent(msg),
                              msg.id
                            )
                          }
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId === msg.id ? (
                            <HugeiconsIcon icon={Tick02Icon} size={18}/>
                            // <Check className="w-3 h-3" />
                          ) : (
                            <HugeiconsIcon icon={Copy01Icon} size={18}/>
                            // <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                    {msg.role === "assistant" && (
                      <div className="absolute right-0 left-5 -bottom-7 flex gap-5 items-center justify-start text-muted-foreground">
                        <div className="relative group">
                          <div className="cursor-pointer hover:text-primary transition-colors">
                            {copiedId === msg.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <HugeiconsIcon icon={Copy01Icon} size={18} onClick={() =>
                                  handleCopyMessage(
                                    getMessageDisplayContent(msg),
                                    msg.id
                                  )
                                }/>
                              // <Copy
                              //   className="w-4 h-4"
                              //   onClick={() =>
                              //     handleCopyMessage(
                              //       getMessageDisplayContent(msg),
                              //       msg.id
                              //     )
                              //   }
                              // />
                            )}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {copiedId === msg.id ? "Copied!" : "Copy"}
                          </div>
                        </div>
                        <HugeiconsIcon icon={ThumbsUpIcon} size={18}/>
                        <HugeiconsIcon icon={ThumbsDownIcon} size={18}/>
                        {/* <ThumbsUp className="w-4 h-4" /> */}
                        {/* <ThumbsDown className="w-4 h-4" /> */}
                      </div>
                    )}
                  </Card>

                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* AI Thinking Indicator - Outside message squares */}
              {sending && (
                <div className="flex gap-3 justify-start mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/30 max-w-[80%]">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin">
                        <HugeiconsIcon icon={Loading03Icon} size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">AI is thinking...</p>
                        <p className="text-sm text-muted-foreground">Processing your request</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input - Absolutely positioned on top of ScrollArea */}
          <div className="absolute bottom-5 left-0 right-0 p-4 ">
            <div className="max-w-[60rem] mx-auto">
              <div
                className="border bg-background/60 backdrop-blur-2xl rounded-xl shadow-lg p-4 transition-all duration-200 group"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add(
                    "border-primary",
                    "bg-primary/5",
                    "scale-[1.02]"
                  );
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "border-primary",
                    "bg-primary/5",
                    "scale-[1.02]"
                  );
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "border-primary",
                    "bg-primary/5",
                    "scale-[1.02]"
                  );
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    setAttachedFiles(Array.from(e.dataTransfer.files));
                  }
                }}
              >
                <div className="flex flex-col gap-4">
                  {/* Show attached files summary when files are selected */}
                  {attachedFiles.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Files ready to send ({attachedFiles.length})
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAttachedFiles([])}
                          className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Clear all
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {attachedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs"
                          >
                            <FileIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    {/* Textarea - hidden during drag */}
                    <div
                      className={cn(
                        "transition-opacity duration-200",
                        isDragging && "opacity-0"
                      )}
                    >
                      <PromptTextarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setMessage(e.target.value)
                        }
                        placeholder="What would you like to know? Ask me anything..."
                        className="min-h-2 max-h-[300px] resize-none overflow-y-auto text-lg"
                        disabled={sending}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                    </div>

                    {/* Drag and drop text - shown during drag */}
                    <div
                      className={cn(
                        "absolute max-w-[60rem] mx-auto inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none",
                        isDragging ? "opacity-100" : "opacity-0"
                      )}
                      id="drag-text"
                    >
                      <div className="text-center w-full flex items-center justify-center flex-col mt-5">
                        <div className="relative flex justify-center items-center size-26">
                          <img
                            src="/images/icon-code.png"
                            alt="demo"
                            className="absolute bottom-7 left-3 size-10 -rotate-[30deg]"
                          />
                          <img
                            src="/images/icon-image.png"
                            alt="demo"
                            className="absolute bottom-0 size-10"
                          />
                          <img
                            src="/images/icon-doc.png"
                            alt="demo"
                            className="absolute bottom-8 right-4 size-8 rotate-[30deg]"
                          />
                        </div>
                        <p className="text-lg font-semibold text-primary">
                          Drag and drop files here
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex w-full justify-between items-center",
                      isDragging && "opacity-0"
                    )}
                  >
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
                        className="rounded-full"
                        title="Knowledge Base - Browse and select files to send to chat"
                        onClick={() => setIsKnowledgeBaseDialogOpen(true)}
                      >
                        <HugeiconsIcon icon={DatabaseIcon}/>
                        {/* <Database className="size-5" /> */}
                      </Button>
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="text/*,application/json,application/xml,text/csv,application/pdf,image/*,application/vnd.openxmlformats-officedocument.*,application/msword"
                          onChange={(e) => {
                            if (e.target.files) {
                              setAttachedFiles(Array.from(e.target.files));
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          className="rounded-full size-10 p-1 relative"
                          title="Attach files"
                          onClick={() => {
                            // Trigger the hidden file input using ref
                            fileInputRef.current?.click();
                          }}
                        >
                          <HugeiconsIcon icon={Attachment02Icon}/>
                          {/* <Paperclip className="size-5" /> */}
                          {attachedFiles.length > 0 && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                              {attachedFiles.length > 9
                                ? "9+"
                                : attachedFiles.length}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* File attachment indicator */}
                      {attachedFiles.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                          <FileIcon className="w-3 h-3" />
                          <span>
                            {attachedFiles.length} file
                            {attachedFiles.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmit}
                        disabled={
                          (!message.trim() && attachedFiles.length === 0) ||
                          sending
                        }
                        className="rounded-full size-12 p-1 bg-primary hover:bg-primary/90"
                        title="Start Chat"
                      >
                        <ArrowUp className="size-6" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Dialog */}
      <KnowledgeBaseDialog
        open={isKnowledgeBaseDialogOpen}
        onOpenChange={setIsKnowledgeBaseDialogOpen}
        onFilesSelected={(selectedFiles) => {
          console.log('Files selected for chat:', selectedFiles);
          // Add selected files to the attached files
          const filesToAttach = selectedFiles.map(file => {
            // Convert ProjectFile to File object for attachment
            return new File(
              [file.url || ''], // Create a file with the URL as content
              file.name || 'unknown',
              { type: file.type || 'application/octet-stream' }
            );
          });
          setAttachedFiles(prev => [...prev, ...filesToAttach]);
          setMessage(prev => prev + `\n\nAttached ${selectedFiles.length} file(s) from knowledge base.`);
        }}
      />
    </ContentLayout>
  );
}
