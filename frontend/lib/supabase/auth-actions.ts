"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function serverSignOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign out failed" }
  }
}

export async function serverFetchProfile(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to fetch profile", data: null }
  }
}

export async function serverUpdateProfile(userId: string, updates: Record<string, any>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

    if (error) {
      return { error: error.message, data: null }
    }

    revalidatePath("/dashboard")
    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update profile", data: null }
  }
}

export async function serverSignIn(email: string, password: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message, data: null }
    }

    revalidatePath("/", "layout")
    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign in failed", data: null }
  }
}

export async function serverSignUp(email: string, password: string, fullName: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      },
    })

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign up failed", data: null }
  }
}

export async function fetchactivesession(){
  try{
    const supabase = await createClient()
    const {
    data: { session },
  } = await supabase.auth.getSession()
  return session

  }catch(err){
    return  {error:err}

  }

}

  
export async function serverResetPassword(email: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
    })

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Password reset failed", data: null }
  }
}

export async function serverUpdatePassword(password: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      return { error: error.message, data: null }
    }

    revalidatePath("/", "layout")
    return { data, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Password update failed", data: null }
  }


}


