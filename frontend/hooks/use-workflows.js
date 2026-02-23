"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { WorkflowService } from "@/lib/supabase/workflows"


export function useWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, profile, session } = useAuth()
  const workflowService = new WorkflowService(profile?.n8n_key, profile?.n8n_endpoint)

  useEffect(() => {
    if (user && profile) {
      loadData()
    }
  }, [user])

  const loadData = async () => {

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

    return
  }

  const getsession = async (wokflowname) => {

    const workflow = await workflowService.getsession(wokflowname)
    return workflow

  }

  const create_session = async (workflowname, payload) => {
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
    try {
      const deletedWorkflow = await workflowService.deleteSession(session_id)
      setWorkflows((prev) => prev.filter((workflow) => workflow.thread_id !== deletedWorkflow))
      return deletedWorkflow
    } catch (err) {
      console.error("Error deleting workflow:", err)
      throw err
    }
  }



  return {
    workflows,
    //sessions,
    loading,
    error,
    getsession,
    create_session,
    // updateSession,
    deleteSession,
    refreshData: loadData,
  }
}
