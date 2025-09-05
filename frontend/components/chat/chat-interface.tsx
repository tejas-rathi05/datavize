'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Brain, Search, Lightbulb, CheckCircle, Clock } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { useChatStore } from '@/hooks/use-chat-store';
import { ChatMessage, ThinkingStep } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TypingIndicator } from './typing-indicator';
import { FastAPIFileUpload } from './fastapi-file-upload';

const thinkingStepIcons = {
  analysis: Brain,
  research: Search,
  reasoning: Lightbulb,
  planning: Sparkles,
  execution: CheckCircle,
};

const thinkingStepColors = {
  analysis: 'bg-blue-500',
  research: 'bg-green-500',
  reasoning: 'bg-yellow-500',
  planning: 'bg-purple-500',
  execution: 'bg-emerald-500',
};

export function ChatInterface() {
  const {
    messages,
    thinkingSteps,
    currentThinkingStep,
    isLoading,
    sendMessage,
    clearMessages,
    currentSessionId,
    addMessage,
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsTyping(true);
    await sendMessage(inputValue.trim());
    setInputValue('');
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Powered by Claude-like AI</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearMessages}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <Avatar className="w-8 h-8">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </Avatar>

                {/* Message Content */}
                <div className={`flex-1 max-w-2xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-2 rounded-full ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Thinking Steps for Assistant Messages */}
                  {message.role === 'assistant' && message.thinkingSteps && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="mt-4 space-y-3"
                    >
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Thinking Process
                      </h4>
                      <div className="space-y-2">
                        {message.thinkingSteps.map((step, stepIndex) => (
                          <ThinkingStepItem
                            key={step.id}
                            step={step}
                            index={stepIndex}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* AI Thinking Indicator - Outside message squares */}
          {(isLoading || currentThinkingStep) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-4 max-w-2xl mx-auto mb-4"
            >
              <Avatar className="w-8 h-8">
                <Bot className="w-4 h-4" />
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted/50 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/30">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <HugeiconsIcon icon={Loading03Icon} size={20} className="text-muted-foreground" />
                    </motion.div>
                    <div>
                      <p className="font-medium text-sm">
                        {currentThinkingStep ? currentThinkingStep.title : "AI is thinking..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentThinkingStep ? currentThinkingStep.description : "Processing your request"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          <TypingIndicator 
            isStreaming={isTyping || isLoading}
          />

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* File Upload Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <FastAPIFileUpload 
            onUploadComplete={(sessionId) => {
              console.log('Files uploaded successfully, session ID:', sessionId);
              // Add a system message to show documents are ready
              const systemMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `📄 Documents uploaded successfully! You can now ask questions about your uploaded files. Session ID: ${sessionId.slice(0, 8)}...`,
                timestamp: new Date(),
              };
              addMessage(systemMessage);
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
              // Add an error message
              const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ Upload failed: ${error}`,
                timestamp: new Date(),
              };
              addMessage(errorMessage);
            }}
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentSessionId ? "Ask questions about your uploaded documents..." : "Upload documents first to start asking questions..."}
              className="flex-1 text-base"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !currentSessionId}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {!currentSessionId && (
            <div className="text-xs text-muted-foreground mt-2 text-center space-y-1">
              <p>📁 Upload documents above to start asking questions</p>
              <p>Supported formats: PDF, DOCX, TXT, and more</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ThinkingStepItem({ step, index }: { step: ThinkingStep; index: number }) {
  const Icon = thinkingStepIcons[step.type];
  const bgColor = thinkingStepColors[step.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex items-center gap-3 p-3 rounded-lg ${
        step.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
        {step.status === 'completed' ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : step.status === 'active' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4 text-white" />
          </motion.div>
        ) : (
          <Clock className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
      <Badge
        variant={step.status === 'completed' ? 'default' : 'secondary'}
        className={`text-xs ${
          step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
        }`}
      >
        {step.status}
      </Badge>
    </motion.div>
  );
}
