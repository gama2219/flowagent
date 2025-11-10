import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { NetworkErrorAlert } from "@/components/network-error-alert"
import "./globals.css"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "AI Workflow Builder - Create n8n Workflows with AI",
  description: "Build powerful n8n automation workflows using AI-powered conversations",
  generator: "v0.app",
}

export default async function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider >
          <NetworkErrorAlert />
          <Suspense>{children}</Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
