"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { createClient } from "@/lib/supabase/client"
import { serverSignOut, serverFetchProfile, serverUpdateProfile, fetchactivesession } from "@/lib/supabase/auth-actions"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState()
  const [n8nprofile, setN8nprofile] = useState()
  const [profile, setProfile] = useState()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState()
  const supabase = createClient()

  useEffect(() => {
    const initialize_user = async () => {
      const sess = await fetchactivesession()
      setSession(sess)
      if (sess?.user) {
        setUser(sess?.user)
      }
      //finally set profile
      fetchProfile(user?.id)

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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user)

      if (session?.user) {
        const { data } = await serverFetchProfile(session.user.id)
        if (data) {
          setProfile(data)
        }
      }
    })
    //const sess= await fetchactivesession()

    setLoading(false)

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
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
    return result
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: "No user logged in", data: null }

    const result = await serverUpdateProfile(user.id || user?.sub, updates)
    console.log(result)
    if (!result.error && result.data) {
      setProfile(result.data)
    }
    return result
  }

  const fetchProfile = async (userId) => {
    const result = await serverFetchProfile(userId)
    if (!result.error && result.data) {
      setProfile(result.data)
    }
    return result
  }

  const value = {
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
