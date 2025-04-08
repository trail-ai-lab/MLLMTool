// app/notebook/page.tsx
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
  const [sourcesFetchError, setSourcesFetchError] = useState<string | null>(null)

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
          console.log('🔍 Attempting to fetch sources for user:', user.id)
          setIsLoadingSources(true)
          setSourcesFetchError(null)

          const sources = await getUserSources()
          
          console.log('📦 Fetched Sources:', {
            count: sources.length,
            sources: sources.map(source => ({
              id: source.id,
              title: source.title,
              type: source.type,
              path: source.path
            }))
          })

          setUserSources(sources)
          
          if (sources.length === 0) {
            console.warn('⚠️ No sources found for the user')
          }
        } catch (error) {
          console.error("❌ Error fetching user sources:", error)
          setSourcesFetchError(error instanceof Error ? error.message : "Unknown error occurred")
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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // If there was an error fetching sources, show error state
  if (sourcesFetchError) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-4">Error Fetching Sources</h2>
          <p className="text-muted-foreground">{sourcesFetchError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <Notebook 
      initialSources={userSources} 
      isLoadingSources={isLoadingSources} 
    />
  )
}