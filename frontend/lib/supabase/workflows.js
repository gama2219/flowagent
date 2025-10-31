import { APIClient } from "@/lib/api/client"

export class WorkflowService {
  constructor(n8n_api_key, auth) {
    this.n8n_api_key = n8n_api_key
    this.auth = auth
    this.client = new APIClient()
  }

  async getWorkflows() {
    try {
      const res = await this.client.post("/api/langgraph/fetch-sessions", {
        n8n_api_key: this.n8n_api_key,
        auth: this.auth,
      })
      return res?.sessions || []
    } catch (error) {
      console.error("Error loading workflows:", error)
      throw error
    }
  }

  async createWorkflow(session_name, payload) {
    try {
      return await this.client.post("/api/langgraph/create-session", {
        n8n_api_key: this.n8n_api_key,
        session_name: session_name,
        payload: payload,
        auth: this.auth,
      })
    } catch (error) {
      console.error("Error creating workflow:", error)
      throw error
    }
  }

  async getsession(session_name) {
    try {
      const res = await this.client.post("/api/langgraph/fetch-session", {
        n8n_api_key: this.n8n_api_key,
        session_name: session_name,
        auth: this.auth,
      })
      return res?.session
    } catch (error) {
      console.error("Error fetching session:", error)
      throw error
    }
  }

  async getMessages(thread_id) {
    try {
      const res = await this.client.post("/api/langgraph/chat-message", {
        n8n_api_key: this.n8n_api_key,
        auth: this.auth,
        thread_id: thread_id,
      })
      return res?.messages || []
    } catch (error) {
      console.error("Error loading messages:", error)
      throw error
    }
  }

  async chat_invoke(message, thread_id) {
    try {
      const res = await this.client.post("/api/langgraph/chat", {
        n8n_api_key: this.n8n_api_key,
        auth: this.auth,
        message: message,
        thread_id: thread_id,
      })
      return res.output
    } catch (error) {
      console.error("Error invoking chat:", error)
      throw error
    }
  }
}
