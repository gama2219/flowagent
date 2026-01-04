"use client"

import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { useMessages } from "@/hooks/use-messages"
import { Bot, Loader2, Workflow, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkflowService } from "@/lib/supabase/workflows"
import { ErrorToast } from "./error-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"

export function ChatInterface({ sessionId, sessionName, workflowName }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, profile, session } = useAuth()
  const { messages, loading: loadingMessages, addMessage, addLocalMessage } = useMessages(sessionId)
  const scrollAreaRef = useRef(null)
  const textareaRef = useRef(null)
  const workflowService = new WorkflowService(profile?.n8n_key,profile?.n8n_endpoint)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  useEffect(() => {
    if (loadingMessages) {
      setLoading(false)
    }
  }, [loadingMessages, messages, workflowName, addLocalMessage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = {
      type: "human",
      content: input.trim(),
    }

    addLocalMessage({
      ...userMessage,
    })

    setInput("")
    setLoading(true)
    setError(null)

    try {
      const response = await workflowService.chat_invoke(userMessage.content, sessionId)

      addLocalMessage({
        type: "ai",
        content: response,
      })
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message. Please check your connection and try again."

      setError(errorMessage)

      addLocalMessage({
        type: "ai",
        content:
          "I apologize, but I encountered an error processing your request. Please check your connection and try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-border p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{sessionName}</h2>
            <p className="text-sm text-muted-foreground">Workflow: {workflowName}</p>
          </div>
        </div>
      </div>

      {/* Messages - scrollable area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn("flex gap-3", message.type === "human" ? "justify-end" : "justify-start")}
              >
                {message.type === "ai" && (
                  <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={cn(
                    "max-w-[80%] p-4",
                    message.type === "human" ? "bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  >
                    {Array.isArray(message.content) ? message.content[0].text : message.content}
                  </ReactMarkdown>
                    
                  </div>
                </Card>

                {message.type === "human" && (
                  <Avatar className="h-8 w-8 bg-secondary flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-[80%] p-4 bg-card">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Input Area - fixed at bottom */}
      <div className="border-t border-border p-4 flex-shrink-0 bg-background">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want your workflow to do..."
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0"
                disabled={!input.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>

      {/* Error Toast Notification */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  )
}
