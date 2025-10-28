import { NextResponse } from "next/server"
import { N8nClient } from "@/lib/n8n/client"
import {createClient} from "@/lib/supabase/server"

export async function GET(request) {
  try {

    const supabase = await createClient()
    const { data:{claims}} = await supabase.auth.getClaims();
    const response = await supabase.from("profiles").select("*").eq("id", claims?.sub).single()

    const n8nClient = new N8nClient(response?.data?.n8n_endpoint, response?.data?.n8n_key)
    const result = await n8nClient.getuser(claims?.email)
    
    return NextResponse.json(result)
 
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
