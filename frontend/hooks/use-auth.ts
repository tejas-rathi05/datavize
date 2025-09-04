import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useAuthStore } from './use-auth-store'

export function useAuth() {
  const { user, session, isAuthenticated, setUser, setSession, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    console.log('useAuth: Initializing authentication...')
    
    // Get initial session from Supabase (this is the source of truth)
    const getSession = async () => {
      try {
        console.log('useAuth: Getting initial session from Supabase...')
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('useAuth: Error getting session:', error)
          // Clear any stale auth state and stop loading
          clearAuth()
        } else {
          console.log('useAuth: Initial session from Supabase:', session ? 'Found' : 'None')
          
          // Always update the store with the current Supabase session state
          // This ensures we're in sync with the actual authentication state
          setSession(session)
          
          // Add a small delay to ensure state is fully synchronized
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('useAuth: Error in getSession:', error)
        clearAuth()
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.email)
        setSession(session)
      }
    )

    return () => {
      console.log('useAuth: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [setSession, setLoading, clearAuth])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('useAuth: Attempting sign in for:', email)
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (data.session) {
        console.log('useAuth: Sign in successful, setting session')
        setSession(data.session)
      } else {
        setLoading(false)
      }

      return { error }
    } catch (error) {
      console.error('useAuth: Sign in error:', error)
      setLoading(false)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log('useAuth: Attempting sign up for:', email)
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (data.session) {
        console.log('useAuth: Sign up successful, setting session')
        setSession(data.session)
      } else {
        setLoading(false)
      }

      return { error }
    } catch (error) {
      console.error('useAuth: Sign up error:', error)
      setLoading(false)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }

  const signOut = async () => {
    try {
      console.log('useAuth: Attempting sign out')
      const { error } = await supabase.auth.signOut()
      if (!error) {
        console.log('useAuth: Sign out successful, clearing session')
        clearAuth()
      }
      return { error }
    } catch (error) {
      console.error('useAuth: Sign out error:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      console.log('useAuth: Attempting OAuth sign in with:', provider)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error('useAuth: OAuth error:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('useAuth: Attempting password reset for:', email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error('useAuth: Reset password error:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }

  return {
    user,
    session,
    loading: false, // No more loading state needed since we're using Zustand
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
  }
}
