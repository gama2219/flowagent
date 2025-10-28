import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"

export async function POST(request){
    //meant to create session
    try{
    const {n8n_api_key,session_name,auth}= await request.json()
    const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key}})
    const session = await client.threads.create({metadata:{thread_name:session_name}})
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