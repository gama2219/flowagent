"use client"

import { useParams } from "next/navigation"
import { useWorkflowContext } from "@/components/workflow-provider"
import { ChatInterface } from "@/components/chat-interface"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function ChatPage() {
    const params = useParams()
    const { workflows, loading } = useWorkflowContext()
    const [activeSession, setActiveSession] = useState(null)

    const sessionId = params.sessionId

    useEffect(() => {
        if (workflows.length > 0 && sessionId) {
            const session = workflows.find((s) => s.thread_id === sessionId)
            setActiveSession(session)
        }
    }, [workflows, sessionId])

    if (loading && workflows.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!activeSession) {
        // If workflows are loaded but session not found, it might be a new session or invalid ID
        // We could show a 404 or just wait if it's still loading
        return (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading session...</p>
            </div>
        )
    }

    return (
        <ChatInterface
            sessionId={activeSession.thread_id}
            sessionName={activeSession.metadata?.thread_name}
            workflowName={activeSession.metadata?.thread_name}
        />
    )
}
