import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ChatMessage } from '@/lib/types';

export interface OpenRouterChatSession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  slug: string;
}

interface OpenRouterChatState {
  // Current session
  currentChat: OpenRouterChatSession | null;
  currentChatId: string | null;
  
  // All chats
  chats: OpenRouterChatSession[];
  
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  
  // Model selection
  selectedModel: string;
  availableModels: string[];
  
  // Actions
  setCurrentChat: (chat: OpenRouterChatSession) => void;
  setCurrentChatId: (chatId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  
  // Chat management
  createNewChat: () => string;
  loadChat: (chatId: string) => void;
  selectChat: (chatId: string) => void;
  saveChat: () => void;
  
  // Model management
  setSelectedModel: (model: string) => void;
  
  // Chat actions
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  startStreaming: () => void;
  stopStreaming: () => void;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
};

const generateChatTitle = (firstMessage: string): string => {
  const words = firstMessage.split(' ').slice(0, 6);
  return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
};

export const useOpenRouterChat = create<OpenRouterChatState>()(
  immer((set, get) => ({
    // Initial state
    currentChat: null,
    currentChatId: null,
    chats: [],
    messages: [],
    isLoading: false,
    isStreaming: false,
    selectedModel: 'gpt-4o',
    availableModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'gemini-pro-1.5',
      'llama-3.1-405b-instruct',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b-instruct',
    ],

    // Session actions
    setCurrentChat: (chat) => {
      set((state) => {
        state.currentChat = chat;
        state.messages = chat.messages;
        state.currentChatId = chat.id;
      });
    },

    setCurrentChatId: (chatId) => {
      set((state) => {
        state.currentChatId = chatId;
      });
    },

    // Message actions
    addMessage: (message) => {
      set((state) => {
        state.messages.push(message);
        if (state.currentChat) {
          state.currentChat.messages.push(message);
          state.currentChat.updatedAt = Date.now();
        }
      });
    },

    updateMessage: (id, updates) => {
      set((state) => {
        const message = state.messages.find(m => m.id === id);
        if (message) {
          Object.assign(message, updates);
        }
        
        // Also update in current chat
        if (state.currentChat) {
          const chatMessage = state.currentChat.messages.find(m => m.id === id);
          if (chatMessage) {
            Object.assign(chatMessage, updates);
          }
        }
      });
    },

    clearMessages: () => {
      set((state) => {
        state.messages = [];
        if (state.currentChat) {
          state.currentChat.messages = [];
        }
      });
    },

    // Chat management
    createNewChat: () => {
      const chatId = `openrouter-${Date.now()}`;
      const newChat: OpenRouterChatSession = {
        id: chatId,
        title: 'New OpenRouter Chat',
        messages: [],
        model: get().selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slug: generateSlug('New OpenRouter Chat'),
      };

      set((state) => {
        state.chats.unshift(newChat);
        state.currentChat = newChat;
        state.currentChatId = chatId;
        state.messages = [];
      });

      return chatId;
    },

    loadChat: (chatId) => {
      const chat = get().chats.find(c => c.id === chatId);
      if (chat) {
        get().setCurrentChat(chat);
      }
    },

    selectChat: (chatId) => {
      get().loadChat(chatId);
    },

    saveChat: () => {
      const { currentChat } = get();
      if (currentChat) {
        set((state) => {
          const chatIndex = state.chats.findIndex(c => c.id === currentChat.id);
          if (chatIndex !== -1) {
            state.chats[chatIndex] = { ...currentChat };
          }
        });
      }
    },

    // Model management
    setSelectedModel: (model) => {
      set((state) => {
        state.selectedModel = model;
        if (state.currentChat) {
          state.currentChat.model = model;
        }
      });
    },

    // Chat actions
    sendMessage: async (content, files = []) => {
      const { addMessage, updateMessage, set, selectedModel, currentChat } = get();
      
      // Set loading state
      set((state) => {
        state.isLoading = true;
      });
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Add assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      addMessage(assistantMessage);

      // Update chat title if this is the first message
      if (currentChat && currentChat.messages.length === 1) {
        const title = generateChatTitle(content);
        set((state) => {
          if (state.currentChat) {
            state.currentChat.title = title;
            state.currentChat.slug = generateSlug(title);
          }
        });
      }

      try {
        // Prepare messages for API
        const messages = get().messages.slice(0, -1); // Exclude the placeholder assistant message
        
        // Make request to OpenRouter API
        const response = await fetch('/api/chat/openrouter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model: selectedModel,
            chatId: currentChat?.id,
            stream: false,
            files: files.length > 0 ? await Promise.all(files.map(async (file) => {
              const buffer = await file.arrayBuffer();
              return {
                name: file.name,
                type: file.type,
                size: file.size,
                data: Buffer.from(buffer).toString('base64')
              };
            })) : []
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update assistant message with final content
        updateMessage(assistantMessage.id, {
          content: data.content,
          isStreaming: false,
        });

        // Save the chat
        get().saveChat();

      } catch (error) {
        console.error('Error sending message:', error);
        
        // Update assistant message with error
        updateMessage(assistantMessage.id, {
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          isStreaming: false,
        });
      } finally {
        // Clear loading state
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    startStreaming: () => {
      set((state) => {
        state.isStreaming = true;
      });
    },

    stopStreaming: () => {
      set((state) => {
        state.isStreaming = false;
      });
    },
  }))
);

