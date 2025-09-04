"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Database,
  Paperclip,
  Mic,
  ArrowUp,
  Plus,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChat } from "@/lib/chat-context";
import { ContentLayout } from "@/components/sidebar/content-layout";
import { PromptTextarea } from "@/components/custom-ui/prompt-text-area";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { BackgroundBeams } from "@/components/ui/background-beams";


export default function NewChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createChat } = useChat();
  const [prompt, setPrompt] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState("gpt-4o");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = React.useState(60);

  // Handle pre-filled prompts from URL parameters
  React.useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams]);

  function adjustTextareaHeight() {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  const handleSubmit = async () => {
    const text = prompt.trim();
    if (!text && attachedFiles.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Create a new empty chat first
      const { id, slug } = createChat(text || "Files uploaded", selectedModel);
      
      console.log('Created chat with ID:', id, 'and slug:', slug);
      console.log('About to store initial message in sessionStorage');
      
      // Store the initial message and files in sessionStorage so they can be sent when the user arrives at the chat page
      const initialMessageData = {
        chatId: id,
        content: text || "Files uploaded",
        model: selectedModel,
        files: attachedFiles
      };
      
      sessionStorage.setItem('initialMessage', JSON.stringify(initialMessageData));
      console.log('Stored initial message in sessionStorage:', initialMessageData);
      console.log('sessionStorage.getItem("initialMessage"):', sessionStorage.getItem('initialMessage'));
      
      // Redirect to the chat session
      console.log('Redirecting to chat page:', `/chat/${slug}`);
      router.push(`/chat/${slug}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <ContentLayout 
      title="New Chat" 
      showContextToggle={true}
      contextType="chat"
      className="pt-16 z-10 h-full min-h-screen"
    >
            <BackgroundBeams />

      {/* Subtle Background Gradient */}
      {/* <div className="absolute h-screen inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255, 218, 185, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(230, 230, 250, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(173, 216, 230, 0.2) 0%, transparent 50%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(248, 248, 255, 0.1) 100%)
            `
          }}
        />
      </div> */}

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        {/* Welcome Section */}
        <div className="text-center mb-8 max-w-2xl">
          <div className="mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Start a new conversation</h1>
          <p className="text-muted-foreground text-lg">
            Ask anything, get instant AI-powered responses, and explore ideas together.
          </p>
        </div>

        {/* Prompt Container */}
        <div className="relative w-full max-w-3xl">

          <div className="border bg-background rounded-xl shadow-sm p-4">
            <div className="flex flex-col gap-4">
              <PromptTextarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like to know? Ask me anything..."
                className="min-h-2 max-h-[300px] resize-none overflow-y-auto text-lg"
                style={{ height: `${textareaHeight}px` }}
                disabled={isSubmitting}
              />
              
              <div className="flex w-full justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    className="rounded-full size-10 p-1"
                    title="Data"
                  >
                    <Database className="size-5" />
                  </Button>
                  <div className="relative">
                    <input
                      ref={(input) => {
                        if (input) input.style.display = 'none';
                      }}
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
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                    >
                      <Paperclip className="size-5" />
                      {attachedFiles.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {attachedFiles.length > 9
                            ? "9+"
                            : attachedFiles.length}
                        </div>
                      )}
                    </Button>
                  </div>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[150px] ml-1 shadow-none">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-5-haiku">Claude 3.5 Haiku</SelectItem>
                        <SelectItem value="llama-3-1-8b">Llama 3.1 8B</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
                    disabled={(!prompt.trim() && attachedFiles.length === 0) || isSubmitting}
                    className="rounded-full size-12 p-1 bg-primary hover:bg-primary/90"
                    title="Start Chat"
                  >
                    <ArrowUp className="size-6" />
                  </Button>
                </div>
              </div>


            </div>
          </div>
          
          {/* Quick Prompts */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Try these prompts to get started
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {[
                "Help me plan a weekend trip to the mountains",
                "Write a professional email to schedule a meeting",
                "Explain quantum computing in simple terms",
                "Create a workout routine for beginners",
                "Help me brainstorm ideas for a blog post",
                "Write a short story about time travel"
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left h-auto p-3 justify-start"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
