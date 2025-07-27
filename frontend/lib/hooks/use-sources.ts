"use client"

import { useEffect, useState } from "react"
import { getSources } from "@/lib/api/sources"

export interface Source {
  path: any
  sourceId: string
  name: string
  fileType: "audio" | "pdf"
  url: string
}

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await getSources()
        setSources(res)
      } catch (err) {
        console.error("Failed to fetch sources:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSources()
  }, [])

  return { sources, loading }
}
