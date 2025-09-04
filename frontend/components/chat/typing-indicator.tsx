'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isStreaming?: boolean;
  className?: string;
}

export function TypingIndicator({ isStreaming, className }: TypingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <span 
      className={cn(
        "enhanced-typing",
        className
      )}
    />
  );
}

export function ThinkingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full thinking-dots" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full thinking-dots" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full thinking-dots" />
      </div>
      <span className="text-sm text-muted-foreground">AI is thinking...</span>
    </div>
  );
}

export function StreamingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
      </div>
      <span className="text-xs text-muted-foreground">AI is typing...</span>
    </div>
  );
}

export function EnhancedTypingIndicator({ isStreaming, className }: { isStreaming?: boolean; className?: string }) {
  if (!isStreaming) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">AI is typing</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

