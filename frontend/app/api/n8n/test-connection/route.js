import { NextResponse } from "next/server"
import { N8nClient } from "@/lib/n8n/client"

export async function POST(request) {
  try {
    const { instanceUrl, apiKey } = await request.json()

    if (!instanceUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Instance URL and API key are required",
        },
        { status: 400 },
      )
    }

    // Test the connection
    const n8nClient = new N8nClient(instanceUrl, apiKey)
    const result = await n8nClient.testConnection()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing n8n connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
