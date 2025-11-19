import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server";

export async function POST(request){
    const supabase = await createClient()
    const { data:{session}} = await supabase.auth.getSession()
    let auth = session?.access_token
    //meant to create session
    let _payload;

    try{
    const {n8n_api_key,n8n_url,session_name,payload}= await request.json()

    if (!payload.extra){
        _payload ={metadata:{thread_name:session_name}}
    }else{
        _payload = {
            metadata:{
                thread_name:session_name},
                graphId:'agent',
                supersteps:[
                    {
                        updates: [{
                            values: {
                                messages: [{
                                    type: 'ai',
                                    content: `I am  flowagent, an AI assistant designed to help you with your n8n workflow creation and management.\n I can help you create, modify, and troubleshoot your workflows, provide guidance on best practices, and answer your n8n-related questions.\n I'm here to be your n8n co-pilot for the following workflow: Name: ${session_name} | ID: ${payload.workflow_id}.`,
                                    name:'flowagent'
                                }],
                            },
                            asNode: '__start__',
                        }],
                    },
                ]
            }

    }


    const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key,"X-N8N-ENDPOINT":n8n_url,}})
    const session = await client.threads.create(_payload)
    return NextResponse.json(session)
} catch (error){
    console.error(error)
    return NextResponse.json(
        {
            success:false,
            error:error,
        },
        {status:500}
    )
}


}
