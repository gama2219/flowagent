"use client"

import { useWorkflowContext } from "@/components/workflow-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Workflow, MessageSquare, Sparkles, Plus } from "lucide-react"

export default function DashboardPage() {
  const { refreshData } = useWorkflowContext()

  const triggerNewSession = () => {

    window.dispatchEvent(new CustomEvent('open-workflow-selector'));
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-balance text-foreground">Welcome to flowagent</h1>
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

        <Button onClick={triggerNewSession} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Start Your First Workflow
        </Button>
      </div>
    </div>
  )
}
