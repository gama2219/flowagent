"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { WorkflowProvider, useWorkflowContext } from "@/components/workflow-provider"
import { WorkflowSelector } from "@/components/workflow-selector"
import { useAuth } from "@/hooks/use-auth"
import { N8nKeySetup } from "@/components/n8n-key-setup"
import { useRouter, useParams } from "next/navigation"
import { Workflow } from "lucide-react"

function FlowagentLayoutContent({ children }) {
    const { profile, loading } = useAuth()
    const { workflows, create_session, deleteSession } = useWorkflowContext()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showWorkflowSelector, setShowWorkflowSelector] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const params = useParams()
    const activeSessionId = params.sessionId

    useEffect(() => {
        setMounted(true)

        const handleOpenSelector = () => setShowWorkflowSelector(true)
        window.addEventListener('open-workflow-selector', handleOpenSelector)
        return () => window.removeEventListener('open-workflow-selector', handleOpenSelector)
    }, [])

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Workflow className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!profile?.n8n_key) {
        return <N8nKeySetup onComplete={() => window.location.reload()} />
    }

    const handleNewSession = () => {
        setShowWorkflowSelector(true)
    }

    const handleWorkflowSelect = async (selection) => {
        try {
            let newWorkflow
            if (selection.type === "new") {
                newWorkflow = await create_session(selection.workflowName, {
                    extra: false,
                    workflow_id: null,
                })
            } else {
                newWorkflow = await create_session(selection.workflowName, {
                    extra: true,
                    workflow_id: selection.workflowId,
                })
            }

            setShowWorkflowSelector(false)
            if (newWorkflow?.thread_id) {
                router.push(`/flowagent/chat/${newWorkflow.thread_id}`)
            }
        } catch (error) {
            console.error("Error creating session:", error)
        }
    }

    const handleSessionSelect = (sessionId) => {
        router.push(`/flowagent/chat/${sessionId}`)
    }

    return (
        <div className="h-screen flex bg-background overflow-hidden text-foreground">
            <Sidebar
                className="flex-shrink-0 relative z-20"
                sessions={workflows}
                activeSessionId={activeSessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onDeleteSession={deleteSession}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {children}
            </main>

            {showWorkflowSelector && (
                <WorkflowSelector onSelect={handleWorkflowSelect} onCancel={() => setShowWorkflowSelector(false)} />
            )}
        </div>
    )
}

export default function FlowagentLayout({ children }) {
    return (
        <WorkflowProvider>
            <FlowagentLayoutContent>{children}</FlowagentLayoutContent>
        </WorkflowProvider>
    )
}
