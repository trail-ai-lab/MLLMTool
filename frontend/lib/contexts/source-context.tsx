"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getTranscript } from "@/lib/api/transcript"
import { getSummary } from "@/lib/api/summary"
import { useSources, Source } from "@/lib/hooks/use-sources"

type SourceContextType = {
  selectedSource: Source | null
  setSelectedSource: (source: Source | null) => void
  transcript: string | null
  loadingTranscript: boolean
  summary: string | null
  loadingSummary: boolean
  sources: Source[]
  loadingSources: boolean
  showRecorder: boolean
  setShowRecorder: (value: boolean) => void
}

const SourceContext = createContext<SourceContextType | undefined>(undefined)

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const { sources, loading: loadingSources } = useSources()
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)

  // Persist selectedSource
  useEffect(() => {
    if (selectedSource?.sourceId) {
      localStorage.setItem("selectedSourceId", selectedSource.sourceId)
    }
  }, [selectedSource])

  // Restore selectedSource from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("selectedSourceId")
    if (!selectedSource && !showRecorder && savedId && sources.length > 0) {
      const matched = sources.find((s) => s.sourceId === savedId)
      if (matched) setSelectedSource(matched)
    }
  }, [sources, selectedSource, showRecorder])

  // Fetch transcript & summary on selection
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSource || selectedSource.fileType !== "audio") {
        setTranscript(null)
        setSummary(null)
        return
      }

      try {
        setLoadingTranscript(true)
        setLoadingSummary(true)

        const transcriptRes = await getTranscript(selectedSource.sourceId)
        setTranscript(transcriptRes.text)

        const summaryRes = await getSummary(selectedSource.sourceId)
        setSummary(summaryRes.text)
      } catch (err) {
        console.error("Failed to fetch transcript/summary:", err)
        setTranscript("Failed to load transcript.")
        setSummary("Failed to load summary.")
      } finally {
        setLoadingTranscript(false)
        setLoadingSummary(false)
      }
    }

    fetchData()
  }, [selectedSource])

  return (
    <SourceContext.Provider
      value={{
        selectedSource,
        setSelectedSource,
        transcript,
        loadingTranscript,
        summary,
        loadingSummary,
        sources,
        loadingSources,
        showRecorder,
        setShowRecorder,
      }}
    >
      {children}
    </SourceContext.Provider>
  )
}

export function useSource() {
  const context = useContext(SourceContext)
  if (!context) throw new Error("useSource must be used within SourceProvider")
  return context
}
