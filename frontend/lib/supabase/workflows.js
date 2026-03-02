import { Client } from "@langchain/langgraph-sdk"

export class WorkflowService {
  constructor(n8n_api_key, n8n_url) {
    this.client = new Client({
      apiUrl: `${window.location.origin}/langgraph`,
      defaultHeaders: {
        "X-N8N-API-KEY": n8n_api_key,
        "X-N8N-ENDPOINT": n8n_url,
      }
    })
  }

  async getWorkflows() {
    try {
      const sessions = await this.client.threads.search()
      return sessions || []
    } catch (error) {
      console.error("Error loading workflows:", error)
      throw error
    }
  }

  async createWorkflow(session_name, payload) {
    let _payload;

    if (!payload.extra) {
      _payload = { metadata: { thread_name: session_name } }
    } else {
      _payload = {
        metadata: {
          thread_name: session_name
        },
        graphId: 'agent',
        supersteps: [
          {
            updates: [{
              values: {
                messages: [{
                  type: 'ai',
                  content: `I am  flowagent, an AI assistant designed to help you with your n8n workflow creation and management.\n I can help you create, modify, and troubleshoot your workflows, provide guidance on best practices, and answer your n8n-related questions.\n I'm here to be your n8n co-pilot for the following workflow: Name: ${session_name} | ID: ${payload.workflow_id}.`,
                  name: 'flowagent'
                }],
              },
              asNode: '__start__',
            }],
          },
        ]
      }

    }
    try {

      const session = await this.client.threads.create(_payload)
      return session
    } catch (error) {
      console.error("Error creating workflow:", error)
      throw error
    }
  }

  async getsession(session_name) {
    try {
      const sessions = await this.client.threads.search({ metadata: { thread_name: session_name } })
      return sessions[0]
    } catch (error) {
      console.error("Error fetching session:", error)
      throw error
    }
  }

  async deleteSession(session_id) {
    try {
      await this.client.threads.delete(session_id)

      return session_id
    } catch (error) {
      console.error("Error deleting session:", error)
      throw error
    }
  }
}
