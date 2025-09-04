'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  try {
    const auth = useAuth()
    
    return (
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    )
  } catch (err) {
    console.error('AuthProvider error:', err)
    
    // Instead of showing an error page, try to continue with null auth state
    // This prevents the app from breaking completely on auth errors
    const fallbackAuth = {
      user: null,
      session: null,
      loading: false,
      signIn: async () => ({ error: { message: 'Authentication not available' } }),
      signUp: async () => ({ error: { message: 'Authentication not available' } }),
      signOut: async () => ({ error: { message: 'Authentication not available' } }),
      signInWithOAuth: async () => ({ error: { message: 'Authentication not available' } }),
      resetPassword: async () => ({ error: { message: 'Authentication not available' } }),
    }
    
    return (
      <AuthContext.Provider value={fallbackAuth}>
        {children}
      </AuthContext.Provider>
    )
  }
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
