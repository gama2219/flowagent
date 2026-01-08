"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWorkflows } from "@/hooks/use-workflows"
import { Loader2, Workflow, Plus, Search, RefreshCw } from "lucide-react"

export function WorkflowSelector({ onSelect, onCancel }) {
  const { workflows, loading } = useWorkflows()
  const [n8nWorkflows, setN8nWorkflows] = useState([])
  const [loadingN8n, setLoadingN8n] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState("")
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [mode, setMode] = useState("existing") // 'existing' or 'new'

  useEffect(() => {
    loadN8nWorkflows()
  }, [])

  const loadN8nWorkflows = async () => {
    setLoadingN8n(true)
    try {
      const response = await fetch("/api/n8n/workflows",{
        method:'GET',
      })
      if (response.ok) {
        const data = await response.json()
        setN8nWorkflows(data.workflows.filter(element=>!element.isArchived) || [])
      } else {
        console.error("Failed to load n8n workflows")
      }
    } catch (error) {
      console.error("Error loading n8n workflows:", error)
    } finally {
      setLoadingN8n(false)
    }
  }

  // Filter workflows that don't have active sessions
  const availableWorkflows = n8nWorkflows.filter((n8nWorkflow) => {
    // Check if this n8n workflow already has a session in our database
    const hasLocalSession = workflows.some(
      (dbWorkflow) =>
        dbWorkflow.metadata.thread_name === n8nWorkflow.name
    )

    const matchesSearch = n8nWorkflow.name.toLowerCase().includes(searchTerm.toLowerCase())
    return !hasLocalSession && matchesSearch
  })

  const handleSubmit = () => {
    if (mode === "existing" && selectedWorkflow) {
      const workflow = n8nWorkflows.find((w) => w.id === selectedWorkflow)
      onSelect({
        type: "existing",
        workflowId: selectedWorkflow,
        workflowName: workflow.name,
        n8nWorkflowId: workflow.id,
      })
    } else if (mode === "new" && newWorkflowName.trim()) {
      onSelect({
        type: "new",
        workflowName: newWorkflowName.trim(),
      })
    }
  }

  const canSubmit = (mode === "existing" && selectedWorkflow) || (mode === "new" && newWorkflowName.trim())

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Create New Chat Session
          </CardTitle>
          <CardDescription>Choose an existing n8n workflow without a session or create a new workflow</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <RadioGroup value={mode} onValueChange={setMode} className="mb-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing">Use existing n8n workflow</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">Create new workflow</Label>
            </div>
          </RadioGroup>

          {mode === "existing" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workflows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={loadN8nWorkflows} disabled={loadingN8n}>
                  <RefreshCw className={`h-4 w-4 ${loadingN8n ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {loadingN8n ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading n8n workflows...</span>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <RadioGroup value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <div className="space-y-2">
                      {availableWorkflows.length === 0 ? (
                        <Alert>
                          <AlertDescription>
                            {n8nWorkflows.length === 0
                              ? "No workflows found in your n8n instance. Create a workflow first or create a new one here."
                              : "No workflows available for new sessions. All existing workflows already have active sessions."}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        availableWorkflows.map((workflow) => (
                          <div
                            key={workflow.id}
                            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent"
                          >
                            <RadioGroupItem value={workflow.id} id={workflow.id} />
                            <Label htmlFor={workflow.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{workflow.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {workflow.active ? "Active" : "Inactive"} • {workflow.nodes?.length || 0} nodes
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">ID: {workflow.id}</div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="workflowName">New Workflow Name</Label>
                <Input
                  id="workflowName"
                  placeholder="Enter workflow name..."
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Start Chat Session
          </Button>
        </div>
      </Card>
    </div>
  )
}
