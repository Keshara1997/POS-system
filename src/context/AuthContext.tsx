import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { User } from '../types'
import { usersService } from '../lib/services'
import { swalConfig } from '../lib/sweetAlert'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to convert auth error messages to user-friendly text
function getAuthErrorMessage(errorMessage: string): string {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link to activate your account.'
  }
  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  if (errorMessage.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  if (errorMessage.includes('Invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (errorMessage.includes('Too many requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }
  if (errorMessage.includes('Network error')) {
    return 'Network connection issue. Please check your internet connection.'
  }
  // Default fallback message
  return 'An unexpected error occurred. Please try again.'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role as any,
          permissions: data.permissions || [],
          active: data.active ?? true,
          lastLogin: data.last_login ? new Date(data.last_login) : undefined,
          avatar: data.avatar || undefined
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      Swal.fire({
        icon: 'error',
        title: 'Profile Error',
        text: 'Failed to load user profile. Please try logging in again.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true
      })
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Show success toast with our styled config
      swalConfig.success('Welcome back! You have successfully signed in.');
    } catch (error: any) {
      setLoading(false)
      
      // Show error toast with our styled config
      swalConfig.error(`Sign In Failed: ${getAuthErrorMessage(error.message)}`);
      throw error
    }
  }

  async function signUp(email: string, password: string, name: string, username: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
          }
        }
      })
      if (error) throw error

      // Create user profile in database
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            name,
            email,
            role: 'cashier', // Default role
            permissions: ['pos_access'],
            active: true
          })
          .select()
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }

        // Set the profile data immediately
        if (profileData) {
          setProfile({
            id: profileData.id,
            username: profileData.username,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as any,
            permissions: profileData.permissions || [],
            active: profileData.active ?? true,
            lastLogin: profileData.last_login ? new Date(profileData.last_login) : undefined,
            avatar: profileData.avatar || undefined
          })
        }
      }
      
      setLoading(false)
      
      // Show success toast with our styled config
      swalConfig.success('Account Created! Your account has been created successfully.');
    } catch (error: any) {
      setLoading(false)
      
      // Show error toast with our styled config
      swalConfig.error(`Sign Up Failed: ${getAuthErrorMessage(error.message)}`);
      throw error
    }
  }

  async function signOut() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Show success toast with our styled config
      swalConfig.success('Signed Out! You have been successfully signed out.');
    } catch (error: any) {
      setLoading(false)
      
      // Show error toast with our styled config
      swalConfig.error(`Sign Out Failed: ${getAuthErrorMessage(error.message)}`);
      throw error
    }
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) throw new Error('No user logged in')
    
    try {
      const updatedProfile = await usersService.update(user.id, updates)
      setProfile(updatedProfile)
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
