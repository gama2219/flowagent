"use client"

import { useState,useEffect} from "react"
import { useAuth } from "@/hooks/use-auth"
import { useWorkflows } from "@/hooks/use-workflows"
import { N8nKeySetup } from "@/components/n8n-key-setup"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { WorkflowSelector } from "@/components/workflow-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Workflow, MessageSquare, Sparkles, Plus } from "lucide-react"

export default function DashboardPage() {
  const { user, profile, loading,session } = useAuth()
  const {workflows,create_session} = useWorkflows()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false)


  


  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Workflow className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

   //Show n8n key setup if not configured
  if (!profile?.n8n_key) {
    return <N8nKeySetup onComplete={() => window.location.reload()} />
  }

  const handleNewSession = () => {
    setShowWorkflowSelector(true)
  }

  const handleWorkflowSelect = async (selection) => {
    try {
      // If creating a new workflow, create it first
      let payload;
      if (selection.type === "new") {
        payload = {
          extra:false,
          workflow_id:null
        }

        const newWorkflow = await create_session(selection.workflowName,payload)
        let workflowId = newWorkflow.thread_id
        setActiveSessionId(workflowId)
        setActiveSession(newWorkflow)
        setShowWorkflowSelector(false)

      }else{

        payload = {
          extra:true,
          workflow_id:selection.workflowId
        }

        const workflow = await create_session(selection.workflowName,payload)
        setActiveSessionId(workflow.thread_id)
        setActiveSession(workflow)
        setShowWorkflowSelector(false)

      }
      
    } catch (error) {
      console.error("Error creating session:", error)
      // Handle error - show toast or alert
    }
  }

  const handleSessionSelect = (sessionId) => {
    const workflow = workflows.find((s) => s.thread_id === sessionId)
    setActiveSessionId(sessionId)
    setActiveSession(workflow)
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar
        sessions={workflows}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <ChatInterface
            sessionId={activeSession?.thread_id}
            sessionName={activeSession?.metadata?.thread_name}
            workflowName={activeSession?.metadata?.thread_name}
          />
        ) : (
          // Welcome screen
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl text-center">
              <div className="mb-8">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-4 text-balance">Welcome to flowagent</h1>
                <p className="text-lg text-muted-foreground text-pretty mb-8">
                  Create powerful n8n automation workflows using natural language conversations. Start by creating a new
                  workflow chat session.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card className="p-6">
                  <CardContent className="p-0">
                    <Workflow className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Smart Workflow Creation</h3>
                    <p className="text-sm text-muted-foreground">
                      Describe your automation needs and let AI build the perfect n8n workflow for you.
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardContent className="p-0">
                    <MessageSquare className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Workflow Maintenance</h3>
                    <p className="text-sm text-muted-foreground">
                      Easily update node configurations or integrate new services with guided assistance.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={handleNewSession} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Start Your First Workflow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Selector Modal */}
      {showWorkflowSelector && (
        <WorkflowSelector onSelect={handleWorkflowSelect} onCancel={() => setShowWorkflowSelector(false)} />
      )}
    </div>
  )
}
