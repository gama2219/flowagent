"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { Bot, Loader2, Workflow, Send, User, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { ErrorToast } from "./error-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { useStream } from "@langchain/langgraph-sdk/react";
import { Client } from "@langchain/langgraph-sdk";

export function ChatInterface({ sessionId, sessionName, workflowName }) {
  const [input, setInput] = useState("")
  const [error, setError] = useState(null)
  const { user, profile } = useAuth()
  const scrollAreaRef = useRef(null)
  const textareaRef = useRef(null)
  const [loadingText, setLoadingText] = useState("Thinking...")



  const client = useMemo(() => {
    const baseUrl = window.location.origin;
    return new Client({
      apiUrl: `${baseUrl}/langgraph`,
      on_disconnect: "cancel",
      defaultHeaders: {
        "X-N8N-API-KEY": profile?.n8n_key,
        "X-N8N-ENDPOINT": profile?.n8n_endpoint,
      }
    });
  }, [profile?.n8n_key, profile?.n8n_endpoint]);

  const { messages: streamMessages, error: streamError, isLoading, submit, toolCalls, activeSubagents, stop, toolProgress } = useStream({
    client,
    threadId: sessionId,
    assistantId: "agent",
    filterSubagentMessages: true,
    streamMode: ["values", "tools"],
    throttle: false
  })


  useEffect(() => {
    if (!isLoading) return;
    const words = ["Thinking...", "Loading...", "Just a moment..."]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % words.length
      setLoadingText(words[i])
    }, 2000)
    return () => clearInterval(interval)
  }, [isLoading])

  const activetools = useMemo(() => {
    if (!isLoading) return null;
    if (toolCalls.length > 1 && ["pending", "error"].includes(toolCalls.at(-1).state)) {
      return toolCalls.at(-1)
    }

  }, [isLoading, toolCalls])
  


  const displayMessages = useMemo(() => {
    if (!streamMessages) return [];
    return streamMessages.filter(msg => {
      // Show all human messages
      if (msg.type === "human") return true;

      // Show flowagent messages that have content and no tool calls
      if (msg.name === "flowagent" && msg.content && msg.content.length > 0) {
        if (!msg.tool_calls || msg.tool_calls.length === 0) return true;
      }

      return false;
    });
  }, [streamMessages]);



  useEffect(() => {
    if (streamError) {
      setError(streamError.message);
    }
  }, [streamError]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [streamMessages, isLoading])


  const handleStreamSubmit = async (e) => {
    e.preventDefault();
    const messageContent = input.trim();
    if (!messageContent || isLoading) return;

    setInput("");

    try {
      await submit(
        { messages: [{ type: "human", content: messageContent }] },
        {
          optimisticValues: (prev) => ({
            ...prev,
            messages: [
              ...(prev.messages || []),
              {
                id: `opt-${Date.now()}`,
                type: "human",
                content: messageContent,
                name: null
              }
            ]
          }),
          streamSubgraphs: true
        }
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleStreamSubmit(e)
    }
  }


  if (!streamMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading conversation...</p>
      </div>
    );
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
            {displayMessages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn("flex gap-3", message.type === "human" ? "justify-end" : "justify-start")}
              >
                {message.type !== "human" && (
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
                  <div className="text-sm leading-relaxed">
                    <div className="whitespace-pre-wrap break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                      >
                        {Array.isArray(message.content) ? message.content[0]?.text : message.content}
                      </ReactMarkdown>
                    </div>
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

            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-[85%] p-4 bg-card border-primary/10 shadow-sm overflow-hidden text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="font-medium text-foreground">
                        {activetools ? "Executing action" : (activeSubagents.length > 0 ? "Collaborating agents" : loadingText)}
                      </span>
                    </div>

                    {(activetools || activeSubagents.length > 0) && (
                      <div className="pl-6 space-y-2 border-l-2 border-primary/10 ml-2">
                        {activetools && (
                          <div className="flex items-center gap-2 text-xs py-1 px-2 bg-primary/5 rounded-md border border-primary/10">
                            <Workflow className="h-3 w-3 text-primary" />
                            <span className="font-mono text-primary/80">{activetools.call.name}</span>
                            <span className={cn(
                              "ml-auto px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold",
                              activetools.state === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                activetools.state === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            )}>
                              {activetools.state}
                            </span>
                          </div>
                        )}

                        {activeSubagents.length > 0 && activeSubagents.map((element, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs py-1.5 px-2 bg-secondary/50 rounded-md animate-in slide-in-from-left-1 duration-200">
                            <Bot className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">
                              {element.toolCall?.subagent_type || "Subagent"}
                            </span>
                            <span className={cn(
                              "ml-auto px-1.5 py-0.5 rounded-full text-[10px] uppercase font-semibold",
                              element.status === "pending" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                element.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            )}>
                              {element.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Input Area - fixed at bottom */}
      <div className="border-t border-border p-4 flex-shrink-0 bg-background">
        <form onSubmit={handleStreamSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want your workflow to do..."
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                disabled={isLoading}
              />
              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-foreground hover:bg-foreground/90 text-background transition-all"
                  onClick={() => stop()}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute -inset-1 rounded-full border border-primary/20 animate-pulse" />
                    <Square className="h-3 w-3 fill-current" />
                  </div>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
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
