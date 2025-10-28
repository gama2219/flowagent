import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"


export async function POST(request){
    //meant to fetch sessions
    try{
    const {n8n_api_key,auth}= await request.json()
    
    const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key}})
    const sessions=await client.threads.search()
    
    return NextResponse.json({sessions:sessions})
}catch(error){
    console.error(error)
    return NextResponse.json(
        {
        success: false,
        error: error,
      },
      { status: 500 },
    )

}
}