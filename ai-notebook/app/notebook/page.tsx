"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Notebook from "../notebook"
import { getUserSources } from "@/lib/supabaseClient"
import { Source } from "@/types/source"

export default function NotebookPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [userSources, setUserSources] = useState<Source[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Fetch user's sources when authenticated
  useEffect(() => {
    async function fetchUserSources() {
      if (user) {
        try {
          const sources = await getUserSources()
          setUserSources(sources)
        } catch (error) {
          console.error("Error fetching user sources:", error)
        } finally {
          setIsLoadingSources(false)
        }
      }
    }

    if (user) {
      fetchUserSources()
    }
  }, [user])

  // If still loading or user not authenticated, show loading state
  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return <Notebook initialSources={userSources} isLoadingSources={isLoadingSources} />
} 