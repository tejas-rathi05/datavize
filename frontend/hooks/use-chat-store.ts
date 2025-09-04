import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ChatMessage, ChatSession, ThinkingStep, Agent } from '@/lib/types';
import { FastAPIService } from '@/lib/fastapi-service';

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  currentAgent: Agent | null;
  currentSessionId: string | null;
  
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  
  // Thinking steps
  thinkingSteps: ThinkingStep[];
  currentThinkingStep: ThinkingStep | null;
  
  // Actions
  setCurrentSession: (session: ChatSession) => void;
  setCurrentAgent: (agent: Agent) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  
  // Thinking steps actions
  addThinkingStep: (step: ThinkingStep) => void;
  updateThinkingStep: (id: string, updates: Partial<ThinkingStep>) => void;
  setCurrentThinkingStep: (step: ThinkingStep | null) => void;
  clearThinkingSteps: () => void;
  
  // Chat actions
  sendMessage: (content: string) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<string | null>;
  startStreaming: () => void;
  stopStreaming: () => void;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    // Initial state
    currentSession: null,
    currentAgent: null,
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    thinkingSteps: [],
    currentThinkingStep: null,

    // Session actions
    setCurrentSession: (session) => {
      set((state) => {
        state.currentSession = session;
        state.messages = session.messages;
      });
    },

    setCurrentAgent: (agent) => {
      set((state) => {
        state.currentAgent = agent;
      });
    },

    setCurrentSessionId: (sessionId) => {
      set((state) => {
        state.currentSessionId = sessionId;
      });
    },

    // Message actions
    addMessage: (message) => {
      set((state) => {
        state.messages.push(message);
      });
    },

    updateMessage: (id, updates) => {
      set((state) => {
        const message = state.messages.find(m => m.id === id);
        if (message) {
          Object.assign(message, updates);
        }
      });
    },

    clearMessages: () => {
      set((state) => {
        state.messages = [];
      });
    },

    // Thinking steps actions
    addThinkingStep: (step) => {
      set((state) => {
        state.thinkingSteps.push(step);
      });
    },

    updateThinkingStep: (id, updates) => {
      set((state) => {
        const step = state.thinkingSteps.find(s => s.id === step.id);
        if (step) {
          Object.assign(step, updates);
        }
      });
    },

    setCurrentThinkingStep: (step) => {
      set((state) => {
        state.currentThinkingStep = step;
      });
    },

    clearThinkingSteps: () => {
      set((state) => {
        state.thinkingSteps = [];
        state.currentThinkingStep = null;
      });
    },

    // Chat actions
    sendMessage: async (content) => {
      const { addMessage, addThinkingStep, updateThinkingStep, setCurrentThinkingStep, set } = get();
      
      // Set loading state
      set((state) => {
        state.isLoading = true;
      });
      
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Add assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      addMessage(assistantMessage);

      // Add thinking steps
      const thinkingSteps: ThinkingStep[] = [
        {
          id: '1',
          type: 'analysis',
          title: 'Analyzing your request',
          description: 'Understanding the context and requirements',
          status: 'active',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'research',
          title: 'Searching documents',
          description: 'Retrieving relevant information from uploaded files',
          status: 'pending',
          timestamp: new Date(),
        },
        {
          id: '3',
          type: 'reasoning',
          title: 'Processing information',
          description: 'Applying AI reasoning to generate response',
          status: 'pending',
          timestamp: new Date(),
        },
        {
          id: '4',
          type: 'execution',
          title: 'Generating response',
          description: 'Creating comprehensive answer',
          status: 'pending',
          timestamp: new Date(),
        },
      ];

      // Add thinking steps
      thinkingSteps.forEach(step => addThinkingStep(step));
      setCurrentThinkingStep(thinkingSteps[0]);

      try {
        // Update first thinking step to completed
        await new Promise(resolve => setTimeout(resolve, 500));
        updateThinkingStep(thinkingSteps[0].id, { status: 'completed' });
        setCurrentThinkingStep(thinkingSteps[1]);
        updateThinkingStep(thinkingSteps[1].id, { status: 'active' });

        // Make request to FastAPI backend /ask endpoint
        const data = await FastAPIService.askQuestion(content, get().currentSessionId);

        // Update thinking steps
        await new Promise(resolve => setTimeout(resolve, 500));
        updateThinkingStep(thinkingSteps[1].id, { status: 'completed' });
        setCurrentThinkingStep(thinkingSteps[2]);
        updateThinkingStep(thinkingSteps[2].id, { status: 'active' });

        await new Promise(resolve => setTimeout(resolve, 500));
        updateThinkingStep(thinkingSteps[2].id, { status: 'completed' });
        setCurrentThinkingStep(thinkingSteps[3]);
        updateThinkingStep(thinkingSteps[3].id, { status: 'active' });

        await new Promise(resolve => setTimeout(resolve, 500));
        updateThinkingStep(thinkingSteps[3].id, { status: 'completed' });
        setCurrentThinkingStep(null);

        // Update assistant message with final content
        updateMessage(assistantMessage.id, {
          content: data.answer,
          isStreaming: false,
          thinkingSteps: thinkingSteps,
        });

      } catch (error) {
        console.error('Error sending message:', error);
        
        // Update thinking steps to show error
        thinkingSteps.forEach(step => {
          updateThinkingStep(step.id, { status: 'error' });
        });
        setCurrentThinkingStep(null);

        // Update assistant message with error
        updateMessage(assistantMessage.id, {
          content: 'Sorry, I encountered an error while processing your request. Please make sure the backend is running and try again.',
          isStreaming: false,
          thinkingSteps: thinkingSteps,
        });
      } finally {
        // Clear loading state
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    uploadFiles: async (files: File[]) => {
      const { setCurrentSessionId } = get();
      
      try {
        const data = await FastAPIService.uploadFiles(files);
        
        // Set the session ID for future requests
        setCurrentSessionId(data.session_id);
        
        return data.session_id;
      } catch (error) {
        console.error('Error uploading files:', error);
        throw error; // Re-throw to let the UI handle the error
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





