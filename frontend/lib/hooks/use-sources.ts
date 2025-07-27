"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
    const fetchSources = async () => {
      try {
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
    }

    fetchSources()
  }, [])

  return { sources, loading }
}
