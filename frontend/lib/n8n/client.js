export class N8nClient {
  constructor(instanceUrl, apiKey) {
    this.baseUrl = instanceUrl // Remove trailing slash
    this.apiKey = apiKey
    this.headers = {
      "X-N8N-API-KEY": apiKey,
      "accept": "application/json",
    }
  }
  


  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`

    const response = await fetch(url, {
      method:options.method,
      headers: {
        ...this.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`n8n API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }



  async getuser(email){


    return this.request(`/users/${email}?includeRole=false`,{method:'GET'})

  }


  // Workflow operations
  async getWorkflows() {
    return this.request("/workflows",{method:'GET'})
  }

  async getWorkflow(id) {
    return this.request(`/workflows/${id}`)
  }

  async createWorkflow(workflowData) {
    return this.request("/workflows", {
      method: "POST",
      body: JSON.stringify(workflowData),
    })
  }

  async updateWorkflow(id, workflowData) {
    return this.request(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflowData),
    })
  }

  async deleteWorkflow(id) {
    return this.request(`/workflows/${id}`, {
      method: "DELETE",
    })
  }

  async activateWorkflow(id) {
    return this.request(`/workflows/${id}/activate`, {
      method: "POST",
    })
  }

  async deactivateWorkflow(id) {
    return this.request(`/workflows/${id}/deactivate`, {
      method: "POST",
    })
  }

  // Execution operations
  async getExecutions(workflowId, options = {}) {
    const params = new URLSearchParams()
    if (workflowId) params.append("workflowId", workflowId)
    if (options.limit) params.append("limit", options.limit)
    if (options.status) params.append("status", options.status)

    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/executions${query}`)
  }

  async executeWorkflow(id, data = {}) {
    return this.request(`/workflows/${id}/execute`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Test connection
  async testConnection() {
    try {
      await this.request("/workflows?limit=1",{method:'GET'})
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}
