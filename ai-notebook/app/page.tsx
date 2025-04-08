"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function Page() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      // If user is authenticated, redirect to notebook
      router.push("/notebook")
    } else {
      // Otherwise redirect to login
      router.push("/login")
    }
  }, [user, isLoading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">AI Notebook</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}

