export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public isNetworkError = true,
  ) {
    super(message)
    this.name = "NetworkError"
  }
}

export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.message
  }

  if (error instanceof TypeError) {
    if (error.message.includes("fetch")) {
      return "Network connection failed. Please check your internet connection and try again."
    }
    if (error.message.includes("JSON")) {
      return "Invalid response from server. Please try again."
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("timeout")) {
      return "Request timed out. Please check your connection and try again."
    }
    if (error.message.includes("abort")) {
      return "Request was cancelled. Please try again."
    }
  }

  return "An unexpected error occurred. Please try again."
}

export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new NetworkError(
        `Server error: ${response.status} ${response.statusText}`,
        `HTTP_${response.status}`,
        false,
      )
    }

    return response
  } catch (error) {
    if (error instanceof NetworkError) {
      throw error
    }

    if (error instanceof TypeError) {
      throw new NetworkError("Network connection failed. Please check your internet connection.", "NETWORK_ERROR")
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NetworkError("Request timed out. Please check your connection and try again.", "TIMEOUT")
    }

    throw new NetworkError("An unexpected error occurred. Please try again.", "UNKNOWN_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}
