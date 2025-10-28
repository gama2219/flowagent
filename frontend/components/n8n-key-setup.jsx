"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Key, ExternalLink, CheckCircle, XCircle } from "lucide-react"

export function N8nKeySetup({ onComplete }) {
  const [apiKey, setApiKey] = useState("")
  const [instanceUrl, setInstanceUrl] = useState("https://")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState("")
  const { updateProfile } = useAuth()

  const testConnection = async () => {
    if (!instanceUrl || !apiKey) {
      setError("Please enter both instance URL and API key")
      return
    }

    setTesting(true)
    setError("")
    setTestResult(null)

    try {
      const response = await fetch("/api/n8n/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceUrl,
          apiKey,
        }),
      })

      const result = await response.json()
      setTestResult(result)

      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to test connection")
      setTestResult({ success: false })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Test connection first if not already tested
    if (!testResult?.success) {
      await testConnection()
      return
    }

    setLoading(true)
    setError("")

    const { error } = await updateProfile({
      n8n_api_key: apiKey,
      n8n_instance_url: instanceUrl,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onComplete()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Connect Your n8n Instance</CardTitle>
          <CardDescription>Enter your n8n API key and instance URL to start creating workflows with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {testResult?.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Connection successful! You can now save your credentials.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="instanceUrl">n8n Instance URL</Label>
              <Input
                id="instanceUrl"
                type="url"
                placeholder="https://your-n8n-instance.com"
                value={instanceUrl}
                onChange={(e) => {
                  setInstanceUrl(e.target.value)
                  setTestResult(null) // Reset test result when URL changes
                }}
                required
                disabled={loading || testing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your n8n API key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setTestResult(null) // Reset test result when key changes
                }}
                required
                disabled={loading || testing}
              />
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>To get your API key, go to your n8n instance → Settings → API Keys → Create new API key</div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={loading || testing || !instanceUrl || !apiKey}
                className="flex-1 bg-transparent"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              <Button type="submit" disabled={loading || testing || !testResult?.success} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
