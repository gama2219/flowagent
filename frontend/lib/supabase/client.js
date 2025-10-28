import { createBrowserClient } from "@supabase/ssr"

export function createClient() {

  const supabaseClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return supabaseClient
}
