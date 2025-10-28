import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"

export async function  POST(request){

    try{
        const {n8n_api_key,auth,message,thread_id}=await request.json()
        let output;

        const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key}})
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
