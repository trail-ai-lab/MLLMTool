"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to recorder by default
    router.replace("/recorder")
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting...</p>
    </div>
  )
}
