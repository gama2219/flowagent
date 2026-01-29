import { Client } from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    let auth = session?.access_token


    try {
        const { n8n_api_key, n8n_url, session_id } = await request.json()
        const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL, defaultHeaders: { Authorization: `Bearer ${auth}`, "X-N8N-API-KEY": n8n_api_key, "X-N8N-ENDPOINT": n8n_url, } })
        await client.threads.delete(session_id)
        return NextResponse.json({
            "session_id": session_id
        })
    } catch (error) {

        return NextResponse.json(
            {
                success: false,
                error: error,
            },
            { status: 500 }
        )
    }


}
