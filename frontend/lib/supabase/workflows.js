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

  
  async createWorkflow(session_name) {

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





  async updateWorkflow(workflowId, updates) {
    const workflow = this.mockData.workflows.find((w) => w.id === workflowId)
    if (workflow) {
      Object.assign(workflow, updates)
    }
    return Promise.resolve(workflow)

    // const { data, error } = await this.supabase.from("workflows").update(updates).eq("id", workflowId).select().single()
    // if (error) throw error
    // return data
  }

  async deleteWorkflow(workflowId) {
    this.mockData.workflows = this.mockData.workflows.filter((w) => w.id !== workflowId)
    return Promise.resolve()

    // const { error } = await this.supabase.from("workflows").delete().eq("id", workflowId)
    // if (error) throw error
  }

  async getChatSessions(workflowname = null) {


    const sessions=await this.client.threads.search({ metadata: { thread_name: workflowname}})
    return sessions[0]

    // let query = this.supabase
    //   .from("chat_sessions")
    //   .select(`
    //     *,
    //     workflows (
    //       id,
    //       name,
    //       n8n_workflow_id
    //     )
    //   `)
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false })

    // if (workflowId) {
    //   query = query.eq("workflow_id", workflowId)
    // }

    // const { data, error } = await query
    // if (error) throw error
    // return data
  }

  async createChatSession(userId, sessionData) {
    const workflow = this.mockData.workflows.find((w) => w.id === sessionData.workflow_id)
    const newSession = {
      id: Date.now(),
      user_id: userId,
      workflow_id: sessionData.workflow_id,
      session_name: sessionData.session_name,
      is_active: true,
      created_at: new Date().toISOString(),
      workflows: workflow ? { id: workflow.id, name: workflow.name, n8n_workflow_id: workflow.n8n_workflow_id } : null,
    }
    this.mockData.sessions.unshift(newSession)
    return Promise.resolve(newSession)

    // const { data, error } = await this.supabase
    //   .from("chat_sessions")
    //   .insert([
    //     {
    //       user_id: userId,
    //       workflow_id: sessionData.workflow_id,
    //       session_name: sessionData.session_name,
    //       is_active: true,
    //     },
    //   ])
    //   .select(`
    //     *,
    //     workflows (
    //       id,
    //       name,
    //       n8n_workflow_id
    //     )
    //   `)
    //   .single()

    // if (error) throw error
    // return data
  }

  async updateChatSession(sessionId, updates) {
    const session = this.mockData.sessions.find((s) => s.id === sessionId)
    if (session) {
      Object.assign(session, updates)
    }
    return Promise.resolve(session)

    // const { data, error } = await this.supabase
    //   .from("chat_sessions")
    //   .update(updates)
    //   .eq("id", sessionId)
    //   .select()
    //   .single()

    // if (error) throw error
    // return data
  }

  async deleteChatSession(sessionId) {
    this.mockData.sessions = this.mockData.sessions.filter((s) => s.id !== sessionId)
    return Promise.resolve()

    // const { error } = await this.supabase.from("chat_sessions").delete().eq("id", sessionId)
    // if (error) throw error
  }


  async createMessage(sessionId, messageData) {
    const newMessage = {
      id: Date.now(),
      session_id: sessionId,
      role: messageData.role,
      content: messageData.content,
      metadata: messageData.metadata || {},
      created_at: new Date().toISOString(),
    }
    this.mockData.messages.push(newMessage)
    return Promise.resolve(newMessage)

    // const { data, error } = await this.supabase
    //   .from("messages")
    //   .insert([
    //     {
    //       session_id: sessionId,
    //       role: messageData.role,
    //       content: messageData.content,
    //       metadata: messageData.metadata || {},
    //     },
    //   ])
    //   .select()
    //   .single()

    // if (error) throw error
    // return data
  }
}
