import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ChatSession } from '@/lib/types';

interface ChatSessionsState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  
  // Actions
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  clearSessions: () => void;
}

export const useChatSessionsStore = create<ChatSessionsState>()(
  immer((set, get) => ({
    // Initial state
    sessions: [],
    currentSession: null,

    // Actions
    addSession: (session) => {
      set((state) => {
        state.sessions.unshift(session);
        state.currentSession = session;
      });
    },

    updateSession: (id, updates) => {
      set((state) => {
        const session = state.sessions.find(s => s.id === id);
        if (session) {
          Object.assign(session, updates);
        }
        if (state.currentSession?.id === id) {
          Object.assign(state.currentSession, updates);
        }
      });
    },

    deleteSession: (id) => {
      set((state) => {
        state.sessions = state.sessions.filter(s => s.id !== id);
        if (state.currentSession?.id === id) {
          state.currentSession = state.sessions[0] || null;
        }
      });
    },

    setCurrentSession: (session) => {
      set((state) => {
        state.currentSession = session;
      });
    },

    clearSessions: () => {
      set((state) => {
        state.sessions = [];
        state.currentSession = null;
      });
    },
  }))
);





