"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { createClient } from "@/lib/supabase/client"



const AuthContext = createContext({})




export  function  AuthProvider({ children,account_profile,session_,user_}) {
  const [user, setUser] = useState(user_)
  const[n8nprofile,setN8nprofile]=useState()
  const [profile, setProfile] = useState(account_profile?.data)
  const [loading, setLoading] = useState(true)
  const [session,setSession]= useState(session_)
  const supabase = createClient()


 




  useEffect(() => {

    const get_user_n8n = async ()=>{
      const response = await fetch('/api/n8n/get-user',{
        method:'GET',
      })
      if (response.ok){
        const result = await response.json()
        setN8nprofile(result)
      }
 
    }


    get_user_n8n()



     // Listen for auth changes
     const {data: { subscription },} = supabase.auth.onAuthStateChange(async (event, session) => {
       setUser(session?.user)

       if (session?.user) {
         await fetchProfile(session.user.id)
       }
     })
     

    setLoading(false)

     return () => subscription.unsubscribe()
  }, [])
  



  const fetchProfile = async (userId) => {

     try {
       const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
       console.log(data)

       if (error) {
         console.error("Error fetching profile:", error)
       } else {
         setProfile(data) 
       }
     } catch (error) {
       console.error("Error in fetchProfile:", error)
     }
  }

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
         emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
       },
     })
     return { data, error }
  }

  const signOut = async () => {

     const { error } = await supabase.auth.signOut()
     return { error }
  }

  const updateProfile = async (updates) => {
    setProfile({ ...profile, ...updates })

     if (!user) return { error: "No user logged in" }

     const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()
     

     if (!error) {
       setProfile(data)
     }

     return { data, error }
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
