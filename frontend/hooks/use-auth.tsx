"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { createClient } from "@/lib/supabase/client"
import { serverSignOut, serverFetchProfile, serverUpdateProfile, fetchactivesession } from "@/lib/supabase/auth-actions"
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js"

export interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  email?: string
  [key: string]: any
}

export interface AuthContextType {
  user: User | null | undefined
  profile: Profile | null | undefined
  loading: boolean
  n8nprofile: any
  supabase: ReturnType<typeof createClient>
  session: Session | null | undefined
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ success?: boolean; error?: string }>
  updateProfile: (updates: any) => Promise<{ data: any; error: any }>
  fetchProfile: (userId: string) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>()
  const [n8nprofile, setN8nprofile] = useState<any>()
  const [profile, setProfile] = useState<Profile | null | undefined>()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null | undefined>()
  const supabase = createClient()

  useEffect(() => {
    const initialize_user = async () => {
      const sess = await fetchactivesession() as Session | null
      setSession(sess)
      if (sess?.user) {
        setUser(sess?.user)
        fetchProfile(sess.user.id)
      }
    }

    initialize_user()

    const get_user_n8n = async () => {
      try {
        const response = await fetch("/api/n8n/get-user", {
          method: "GET",
        })
        if (response.ok) {
          const result = await response.json()
          setN8nprofile(result)
        }
      } catch (error) {
        console.error("Error fetching n8n profile:", error)
      }
    }

    get_user_n8n()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user)

      if (session?.user) {
        const { data } = await serverFetchProfile(session.user.id)
        if (data) {
          setProfile(data as Profile)
        }
      }
    })

    setLoading(false)

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/flowagent`,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const result = await serverSignOut()
    if (!result.error) {
      setUser(null)
      setProfile(null)
    }
    return result as { success?: boolean; error?: string }
  }

  const updateProfile = async (updates: any) => {
    const userId = user?.id || (user as any)?.sub
    if (!userId) return { error: "No user logged in", data: null }

    const result = await serverUpdateProfile(userId, updates)
    if (!result.error && result.data) {
      setProfile(result.data as Profile)
    }
    return result
  }

  const fetchProfile = async (userId: string) => {
    const result = await serverFetchProfile(userId)
    if (!result.error && result.data) {
      setProfile(result.data as Profile)
    }
    return result
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    n8nprofile,
    supabase,
    session,
    signIn,
    signUp,
    signOut,
    updateProfile,
    fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
