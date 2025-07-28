"use client"

import { useEffect, useState, useCallback } from "react"
import { getSources } from "@/lib/api/sources"
import { FileAudio, FileText, type LucideIcon } from "lucide-react"

export interface Source {
  path: string
  sourceId: string
  name: string
  fileType: "audio" | "pdf"
  url: string
  icon: LucideIcon
}

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getSources()

      // ✅ Add icon dynamically
      const sourcesWithIcons: Source[] = res.map(
        (src: Omit<Source, "icon">) => ({
          ...src,
          icon: src.fileType === "audio" ? FileAudio : FileText,
        })
      )

      setSources(sourcesWithIcons)
    } catch (err) {
      console.error("Failed to fetch sources:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const refreshSources = useCallback(() => {
    fetchSources()
  }, [fetchSources])

  const addSource = useCallback((newSource: Omit<Source, "icon">) => {
    const sourceWithIcon: Source = {
      ...newSource,
      icon: newSource.fileType === "audio" ? FileAudio : FileText,
    }
    setSources(prev => [sourceWithIcon, ...prev])
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    setSources(prev => prev.filter(source => source.sourceId !== sourceId))
  }, [])

  return {
    sources,
    loading,
    refreshSources,
    addSource,
    removeSource
  }
}
