import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import "./globals.css"
import { Suspense } from "react"
import {createClient} from "@/lib/supabase/server"

export const metadata = {
  title: "AI Workflow Builder - Create n8n Workflows with AI",
  description: "Build powerful n8n automation workflows using AI-powered conversations",
  generator: "v0.app",
}





export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data:{claims} } = await supabase.auth.getClaims();
  const { data:{session}} = await supabase.auth.getSession()
  const response = await supabase.from("profiles").select("*").eq("id",claims?.sub).single()




  

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider account_profile={response} session_={session} user_={claims}>
          <Suspense>{children}</Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
