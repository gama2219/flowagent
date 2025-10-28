"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { WorkflowService } from "@/lib/supabase/workflows"


export function useWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user,profile,session} = useAuth()
  const workflowService = new WorkflowService(profile?.n8n_key,session?.access_token)

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

  const createWorkflow = async (workflowData) => {
    const _newWorkflow = {
      "name": workflowData.name,
      "nodes": [
  ],
  "connections": {

  },
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 3600,
    "errorWorkflow": "VzqKEW0ShTXA5vPj",
    "timezone": "America/New_York",
    "executionOrder": "v1"
  }
}
    



     try {


        const response = await fetch('/api/n8n/workflows',{
          method:'POST',
          headers:{
            "Content-Type": "application/json",
          },
          body:JSON.stringify(
            {
              "n8n_endpoint":profile?.n8n_endpoint,
              "n8n_key":profile?.n8n_key,
              "workflow_json":JSON.stringify(_newWorkflow)
            }
          )
        })

        let the_new_created_workflow = await response.json()
       const newWorkflow = await workflowService.createWorkflow(the_new_created_workflow.name)
       console.log(newWorkflow)
       setWorkflows((prev) => [newWorkflow, ...prev])
       return newWorkflow
      
     } catch (err) {
       console.error("Error creating workflow:", err)
       throw err
     }
  }

  const getsession = async (wokflowname) => {

    const workflow = await workflowService.getsession(wokflowname)
    return workflow

  }

  const create_session = async (workflowname) => {
    try{
    const newWorkflow = await workflowService.createWorkflow(workflowname)
    setWorkflows((prev) => [newWorkflow, ...prev])
    return newWorkflow
  }catch (err){
    console.error("Error creating workflow:", err)
    throw err
  }

  }



  return {
    workflows,
    //sessions,
    loading,
    error,
    createWorkflow,
    getsession,
    create_session,
   // updateSession,
   //deleteSession,
    refreshData: loadData,
  }
}
