"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { transcribeSource } from "@/lib/api/transcribe"
import { getTranscript } from "@/lib/api/transcript"
import { getSummary } from "@/lib/api/summary"

type Source = {
  name: string
  url: string
  fileType: "audio" | "pdf"
  path: string
  sourceId: string
}

type SourceContextType = {
  selectedSource: Source | null
  setSelectedSource: (source: Source | null) => void
  transcript: string | null
  loadingTranscript: boolean
  summary: string | null
  loadingSummary: boolean
}

const SourceContext = createContext<SourceContextType | undefined>(undefined)

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    const fetchTranscriptAndSummary = async () => {
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

        // const summaryRes = await getSummary(selectedSource.sourceId)
        // setSummary(summaryRes.text)
      } catch (err) {
        console.error("Failed to fetch transcript/summary:", err)
        setTranscript("Failed to load transcript.")
        setSummary("Failed to load summary.")
      } finally {
        setLoadingTranscript(false)
        setLoadingSummary(false)
      }
    }

    fetchTranscriptAndSummary()
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
