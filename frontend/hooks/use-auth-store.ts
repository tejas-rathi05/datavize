import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user: User | null) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false
        }),
      setSession: (session: Session | null) => 
        set({ 
          session, 
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false
        }),
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),
      clearAuth: () => 
        set({ 
          user: null, 
          session: null, 
          isAuthenticated: false,
          isLoading: false
        }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Export selectors for easier access
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthActions = () => useAuthStore((state) => ({
  setUser: state.setUser,
  setSession: state.setSession,
  setLoading: state.setLoading,
  clearAuth: state.clearAuth,
}));
