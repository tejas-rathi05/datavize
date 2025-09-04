import React from "react";
import { cn } from "@/lib/utils";

interface StreamingStackViewerProps {
  streamingStack?: string[];
  isStreaming?: boolean;
  className?: string;
}

export function StreamingStackViewer({ streamingStack, isStreaming, className }: StreamingStackViewerProps) {
  if (!isStreaming || !streamingStack || streamingStack.length === 0) return null;

  return (
    <div className={cn("mt-3 p-2 bg-muted/50 rounded-lg border", className)}>
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Streaming Stack ({streamingStack.length} chunks)
      </div>
      
      {/* Visual representation of the stack */}
      <div className="space-y-1">
        {streamingStack.map((chunk, index) => (
          <div
            key={index}
            className={cn(
              "text-xs p-1 rounded border",
              index === streamingStack.length - 1 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            <span className="font-mono">
              Chunk {index + 1}: "{chunk}"
            </span>
          </div>
        ))}
      </div>
      
      {/* Stack summary */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div>Total characters: {streamingStack.join('').length}</div>
        <div>Latest chunk: {streamingStack[streamingStack.length - 1]}</div>
      </div>
    </div>
  );
}

export function StackChunkCounter({ streamingStack, isStreaming }: { streamingStack?: string[]; isStreaming?: boolean }) {
  if (!isStreaming || !streamingStack) return null;

  return (
    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span>📚</span>
      <span>{streamingStack.length}</span>
      <span>chunks</span>
    </div>
  );
}

export function StreamingProgress({ streamingStack, isStreaming }: { streamingStack?: string[]; isStreaming?: boolean }) {
  if (!isStreaming || !streamingStack) return null;

  const totalChunks = streamingStack.length;
  const progress = Math.min((totalChunks / 20) * 100, 100); // Assume ~20 chunks for a typical response

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Streaming progress</span>
        <span>{totalChunks} chunks</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
