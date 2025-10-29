import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { N8nClient } from "@/lib/n8n/client"

export async function GET(request) {
  try {
 
     const supabase = await createClient()

     // Get current user
     const {
       data: { user },
       error: authError,
     } = await supabase.auth.getUser()
     if (authError || !user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
     }

     // Get user profile with n8n credentials
     const { data: profile, error: profileError } = await supabase
       .from("profiles")
       .select("n8n_key, n8n_endpoint")
       .eq("id", user.id)
       .single()

     if (profileError || !profile?.n8n_key) {
       return NextResponse.json({ error: "n8n credentials not found" }, { status: 400 })
     }

     // Initialize n8n client
     const n8nClient = new N8nClient(profile.n8n_endpoint, profile.n8n_key)

     // Fetch workflows from n8n
     const workflows = await n8nClient.getWorkflows()

     return NextResponse.json({ workflows: workflows.data || workflows })
  } catch (error) {
    console.error("Error fetching n8n workflows:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {

  const createworkflow =async (workflow_json,n8n_endpoint,n8n_key)=>{
    const response =await fetch(`${n8n_endpoint}/api/v1/workflows`,{
      method:'POST',
      headers:{
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8n_key
      },
      body:workflow_json
    })
    if (response.ok){
      let workflow= await response.json()
      return workflow
    }else{
      throw new Error(response.statusText)
    }
  }


  try {
    const {n8n_endpoint,n8n_key,workflow_json}= await request.json()

    const n8n_workflow_creation= await createworkflow(workflow_json,n8n_endpoint,n8n_key)
    return NextResponse.json(n8n_workflow_creation)

  } catch (error) {
    console.error("Error creating n8n workflow:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
