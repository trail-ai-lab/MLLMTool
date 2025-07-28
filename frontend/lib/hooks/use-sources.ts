"use client"

import { useEffect, useState, useCallback } from "react"
import { getSources } from "@/lib/api/sources"
import { FileAudio, FileText } from "lucide-react"
import type { Source, BaseSource } from "@/types"

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getSources()

      // ✅ Add icon dynamically
      const sourcesWithIcons: Source[] = res.map(
        (src: BaseSource) => ({
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

  const addSource = useCallback((newSource: BaseSource) => {
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
