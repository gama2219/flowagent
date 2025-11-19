import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server";

export async function  POST(request){
    const supabase = await createClient()
    const { data:{session}} = await supabase.auth.getSession()
    let auth = session?.access_token

    try{
        const {n8n_api_key,n8n_url,message,thread_id}=await request.json()
        let output;

        const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key,"X-N8N-ENDPOINT":n8n_url,}})
        const streamResponse = client.runs.stream(
            thread_id, // Threadless run
             "agent", // Assistant ID
            {
                input: {
                    "messages": [
                         { "role": "user", "content": message}
                        ]
                    },
                    streamMode: "values",
                }
            );
        
        for await (const chunk of streamResponse) {
            output = chunk
        
        }

        return NextResponse.json({
            output:output.data.messages[output.data.messages.length - 1 ].content
        })


    }catch(error){
        console.error(error)

        return NextResponse.json({ error: error.message }, { status: 500 })

    }


}
