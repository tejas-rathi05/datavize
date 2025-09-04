'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Brain, Zap, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeMessageProps {
  agentName: string;
  onStartChat: () => void;
}

const features = [
  {
    icon: Brain,
    title: 'Advanced AI Reasoning',
    description: 'See the AI think through problems step by step',
  },
  {
    icon: Sparkles,
    title: 'Creative Solutions',
    description: 'Get innovative and creative responses to your questions',
  },
  {
    icon: Zap,
    title: 'Fast & Efficient',
    description: 'Quick responses with detailed explanations',
  },
  {
    icon: MessageSquare,
    title: 'Context Aware',
    description: 'Remembers conversation history and context',
  },
];

export function WelcomeMessage({ agentName, onStartChat }: WelcomeMessageProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-2xl"
      >
        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl"
          >
            <Bot className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to {agentName}
            </h1>
            <p className="text-xl text-muted-foreground">
              Your intelligent AI companion for meaningful conversations
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground text-left">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="space-y-4"
        >
          <p className="text-muted-foreground">
            Ready to start? Ask me anything - from coding questions to creative writing!
          </p>
          <Button 
            onClick={onStartChat} 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Start Chatting
          </Button>
        </motion.div>

        {/* Quick Start Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="pt-8 border-t"
        >
          <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
            Try asking me about:
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'How to build a React app',
              'Write a poem about technology',
              'Explain quantum computing',
              'Help me debug this code',
              'Plan a project timeline',
              'Creative writing ideas'
            ].map((example, index) => (
              <motion.span
                key={example}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                onClick={() => onStartChat()}
              >
                {example}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}





