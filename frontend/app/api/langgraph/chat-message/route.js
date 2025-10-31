import {Client} from "@langchain/langgraph-sdk"
import { NextResponse } from "next/server"

export async function  POST(request){

    try{
        const {n8n_api_key,auth,thread_id}=await request.json()
        const client = new Client({ apiUrl: process.env.LANGGRAPH_SERVER_URL,defaultHeaders:{Authorization: `Bearer ${auth}`,"X-N8N-API-KEY":n8n_api_key}})
        const messages= await client.threads.getState(thread_id).then(res=>res.values.messages)
        
        if (messages){
          let filterd_messages = messages.filter(x=>((x.content.length > 0  && x.name==='flowagent' && x.tool_calls.length == 0 ) || (x.type ===  'human' && x.name==null) ))
        return NextResponse.json({
            messages:filterd_messages
        })
      }else{
        return NextResponse.json({
          // return an empty list if no message
            messages:[]
        })
      }


    }catch(error){
        return NextResponse.json({ error: error.message }, { status: 500 })

    }


}
/*
this is the response format
[
  {
    content: 'hello introduce your self and tell me your abilities',
    additional_kwargs: {},
    response_metadata: {},
    type: 'human',
    name: null,
    id: 'c95c6a23-4623-450f-9a3a-5738d051a0a1',
    example: false
  },
  {
    content: "Hello! I'm flowagent, an advanced AI assistant designed to help you create and manage workflows in n8n.\n" +
      '\n' +
      'My main goal is to make your n8n development process smoother and more efficient. I can assist you in several ways:\n' +
      '\n' +
      "*   **Workflow Creation and Management:** I can create, update, and retrieve n8n workflows for you. Just describe what you need, and I'll handle the JSON and API calls.\n" +
      '*   **Guidance and Best Practices:** I can provide advice on architectural patterns, help you debug issues, and offer insights into effective workflow design.\n' +
      '*   **Finding Solutions:** I can search the web for official documentation, community solutions, and advanced n8n concepts to answer your questions.\n' +
      '*   **Using Examples:** I have access to a database of workflow examples, which I can use as a starting point to build a solution tailored to your specific needs.\n' +
      '\n' +
      'Think of me as your n8n co-pilot, here to support you at every step of your project.\n' +
      '\n' +
      'How can I help you today?',
    additional_kwargs: {},
    response_metadata: {
      safety_ratings: [],
      finish_reason: 'STOP',
      model_name: 'gemini-2.5-pro'
    },
    type: 'ai',
    name: 'flowagent',
    id: 'run--0110ab75-c37b-4824-b2f3-a3000606314c',
    example: false,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: {
      input_tokens: 1197,
      output_tokens: 218,
      total_tokens: 1698,
      input_token_details: [Object],
      output_token_details: [Object]
    }
  }
]
*/
