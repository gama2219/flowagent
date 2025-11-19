"use client"

import { useState, useEffect } from "react"
import { WorkflowService } from "@/lib/supabase/workflows"
import { useAuth } from "./use-auth"


export function useMessages(sessionId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user,profile,session} = useAuth()
  const workflowService = new WorkflowService(profile?.n8n_key,profile?.n8n_endpoint)

  useEffect(() => {
    if (sessionId) {
      loadMessages()
    }
  }, [sessionId])

  const loadMessages = async () => {
     try {
       setLoading(true)
       const data = await workflowService.getMessages(sessionId)
       setMessages(data)
       setError(null)
     } catch (err) {
       console.error("Error loading messages:", err)
       setError(err.message)
     } finally {
       setLoading(false)
     }
  }

  const addMessage = async (messageData) => {
    const newMessage = {
      id: Date.now(),
      session_id: sessionId,
      role: messageData.role,
      content: messageData.content,
      metadata: messageData.metadata || {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage

    // try {
    //   const newMessage = await workflowService.createMessage(sessionId, messageData)
    //   setMessages((prev) => [...prev, newMessage])
    //   return newMessage
    // } catch (err) {
    //   console.error("Error adding message:", err)
    //   throw err
    // }
  }

  const addLocalMessage = (message) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }])
  }

  return {
    messages,
    loading,
    error,
    addMessage,
    addLocalMessage,
    refreshMessages: loadMessages,
  }
}
