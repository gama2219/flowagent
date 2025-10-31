export class APIClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl = "", timeout = 30000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection.")
      }
      if (error instanceof TypeError) {
        throw new Error("Network error. Please check your connection.")
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
    return response.json()
  }

  async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return response.json()
  }

  async put<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return response.json()
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
    return response.json()
  }
}
