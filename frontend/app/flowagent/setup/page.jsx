"use client"

import { N8nKeySetup } from "@/components/n8n-key-setup"
import { useRouter } from "next/navigation"

export default function SetupPage() {
    const router = useRouter()

    const handleComplete = () => {
        // Redirect back to the main flowagent page after setup
        router.push("/flowagent")
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <N8nKeySetup onComplete={handleComplete} />
        </div>
    )
}
