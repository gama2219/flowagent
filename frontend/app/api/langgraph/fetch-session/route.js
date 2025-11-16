import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server";


export async function POST(request){
    const supabase = await createClient()
    const { data:{session}} = await supabase.auth.getSession()
    let auth = session?.access_token
    //meant to fetch session
    try{
    const {n8n_api_key,session_name}= await request.json()
    
    const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key}})
    const sessions=await client.threads.search({ metadata: { thread_name: session_name}})
    
    return NextResponse.json({session:sessions[0]})
}catch(error){
    
    return NextResponse.json(
        {
        success: false,
        error: error,
      },
      { status: 500 },
    )

}
}
