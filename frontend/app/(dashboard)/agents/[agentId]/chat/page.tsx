'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/hooks/use-chat-store';
import { useChatSessionsStore } from '@/hooks/use-chat-sessions-store';
import { ChatSession, Agent } from '@/lib/types';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSessionsList } from '@/components/chat/chat-sessions-list';
import { WelcomeMessage } from '@/components/chat/welcome-message';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

// Mock agent data - replace with actual data
const mockAgent: Agent = {
  id: 'agent-1',
  name: 'Claude AI Assistant',
  description: 'A helpful AI assistant powered by Claude-like technology',
  avatar: '/api/placeholder/40/40',
  capabilities: ['Text Generation', 'Code Analysis', 'Problem Solving', 'Creative Writing'],
  systemPrompt: 'You are a helpful AI assistant that provides thoughtful, accurate, and engaging responses.',
  model: 'claude-3-sonnet',
  temperature: 0.7,
  maxTokens: 4000,
};

export default function ChatPage() {
  const { setCurrentAgent } = useChatStore();
  const { 
    sessions, 
    currentSession, 
    addSession, 
    setCurrentSession 
  } = useChatSessionsStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Set the current agent when the component mounts
    setCurrentAgent(mockAgent);
  }, [setCurrentAgent]);

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateNew = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      agentId: mockAgent.id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    addSession(newSession);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="h-10 w-10 p-0"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative inset-y-0 left-0 z-40 w-80 bg-background border-r shadow-lg md:shadow-none"
          >
            <ChatSessionsList
              onSessionSelect={handleSessionSelect}
              onCreateNew={handleCreateNew}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <ChatInterface />
        ) : (
          <WelcomeMessage 
            agentName={mockAgent.name}
            onStartChat={handleCreateNew}
          />
        )}
      </div>
    </div>
  );
}
