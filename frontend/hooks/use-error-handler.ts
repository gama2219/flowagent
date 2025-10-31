"use client"

import { useState, useCallback } from "react"

export interface ErrorState {
  message: string
  code?: string
  timestamp: number
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null)

  const handleError = useCallback((err: unknown, defaultMessage = "An error occurred") => {
    let message = defaultMessage
    let code = "UNKNOWN"

    if (err instanceof Error) {
      message = err.message
      if ("code" in err) {
        code = (err as any).code
      }
    } else if (typeof err === "string") {
      message = err
    }

    const errorState: ErrorState = {
      message,
      code,
      timestamp: Date.now(),
    }

    setError(errorState)
    return errorState
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
  }
}
