// import { createClient } from "./client"

export class WorkflowService {
  constructor(n8n_api_key,auth) {
    this.n8n_api_key=n8n_api_key
    this.auth=auth
   
  }

  async getWorkflows() {

    const res = await fetch(
      '/api/langgraph/fetch-sessions',{
        method:'POST',
        headers:{
          "Content-Type": "application/json",
        },
        body:JSON.stringify({
          n8n_api_key:this.n8n_api_key,
          auth:this.auth         
        })

      }
    ).then(response=>{
      if (response.ok) return response.json()
    }

    )

    return res?.sessions

  }

  
  async createWorkflow(session_name,payload) {

    const res = await fetch(
      '/api/langgraph/create-session',
      {
        method:'POST',
        headers:{
          "Content-Type": "application/json",
        },
        body:JSON.stringify({
          n8n_api_key:this.n8n_api_key,
          session_name:session_name,
          payload:payload,
          auth:this.auth
        })
      }
    ).then(response=>{
      if (response.ok) return response.json()
    })

    return res


  }

  async getsession(session_name){

    const res = await fetch(
      '/api/langgraph/fetch-session',
      {
        method:'post',
        headers:{
          "Content-Type": "application/json",         
        },
        body:JSON.stringify({
          n8n_api_key:this.n8n_api_key,
          session_name:session_name,
          auth:this.auth
        })

      }
    ).then(response => {
      if (response.ok) return response.json()
    })

    return res?.session


  }
  
  async getMessages(thread_id) {
    const res = await fetch(
      '/api/langgraph/chat-message',
      {
        method:'POST',
        headers:{
          "Content-Type": "application/json", 
        },
        body:JSON.stringify({
          n8n_api_key:this.n8n_api_key,
          auth:this.auth,
          thread_id:thread_id
        })
      }
    ).then(response => {
      if (response.ok) return response.json()
    })

    return res?.messages


  }

  async chat_invoke (message,thread_id){
    const res = await fetch(
      '/api/langgraph/chat',
      {
        method:'POST',
        headers:{
          "Content-Type": "application/json", 
        },
        body:JSON.stringify({
          n8n_api_key:this.n8n_api_key,
          auth:this.auth,
          message:message,
          thread_id,thread_id
        })
      }
    ).then(response => {
      if (response.ok) return response.json()
    })

    return res.output


  }

}
