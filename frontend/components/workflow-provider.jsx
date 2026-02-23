"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { WorkflowService } from "@/lib/supabase/workflows"
import { useRouter, useParams } from "next/navigation"

const WorkflowContext = createContext()

export function WorkflowProvider({ children }) {
    const { user, profile } = useAuth()
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()
    const params = useParams()

    const workflowService = React.useMemo(() => {
        if (profile?.n8n_key && profile?.n8n_endpoint) {
            return new WorkflowService(profile.n8n_key, profile.n8n_endpoint)
        }
        return null
    }, [profile?.n8n_key, profile?.n8n_endpoint])

    const loadData = useCallback(async () => {
        if (!workflowService || !user) return

        try {
            setLoading(true)
            const workflowsData = await workflowService.getWorkflows()
            setWorkflows(workflowsData)
            setError(null)
        } catch (err) {
            console.error("Error loading data:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [workflowService, user])

    useEffect(() => {
        if (user && profile) {
            loadData()
        }
    }, [user, profile, loadData])

    const create_session = async (workflowname, payload) => {
        if (!workflowService) throw new Error("Workflow service not initialized")
        try {
            const newWorkflow = await workflowService.createWorkflow(workflowname, payload)
            setWorkflows((prev) => [newWorkflow, ...prev])
            return newWorkflow
        } catch (err) {
            console.error("Error creating workflow:", err)
            throw err
        }
    }

    const deleteSession = async (session_id) => {
        if (!workflowService) throw new Error("Workflow service not initialized")
        try {
            const deletedWorkflow = await workflowService.deleteSession(session_id)
            setWorkflows((prev) => prev.filter((workflow) => workflow.thread_id !== deletedWorkflow))

            // If we are currently on the deleted session's page, redirect to dashboard
            if (params.sessionId === session_id) {
                router.push("/flowagent")
            }

            return deletedWorkflow
        } catch (err) {
            console.error("Error deleting workflow:", err)
            throw err
        }
    }

    const value = {
        workflows,
        loading,
        error,
        create_session,
        deleteSession,
        refreshData: loadData,
    }

    return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
}

export function useWorkflowContext() {
    const context = useContext(WorkflowContext)
    if (!context) {
        throw new Error("useWorkflowContext must be used within a WorkflowProvider")
    }
    return context
}
