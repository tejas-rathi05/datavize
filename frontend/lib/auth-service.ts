import { prisma } from './prisma'
import { supabase } from './supabase'
import { User } from './server-types'

export interface AuthUser {
  id: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, fullName?: string) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user record in Prisma database
        const user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            fullName: fullName || null,
          },
        })

        return { user, session: authData.session }
      }

      throw new Error('Failed to create user')
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Get user from Prisma database
        const user = await prisma.user.findUnique({
          where: { id: data.user.id },
        })

        return { user, session: data.session }
      }

      throw new Error('Failed to sign in')
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error || !authUser) return null

      // Get user from Prisma database
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      })

      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get current session error:', error)
      return null
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<Pick<User, 'fullName' | 'avatarUrl'>>) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
      })

      return user
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession()
      return !!session
    } catch (error) {
      return false
    }
  }
}
