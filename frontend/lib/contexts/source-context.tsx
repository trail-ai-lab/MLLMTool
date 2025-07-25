"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { transcribeSource } from "@/lib/api/transcribe"
import { getTranscript } from "@/lib/api/transcript"

type Source = {
  name: string
  url: string
  fileType: "audio" | "pdf"
  path: string
  sessionId: string
}

type SourceContextType = {
  selectedSource: Source | null
  setSelectedSource: (source: Source | null) => void
  transcript: string | null
  loadingTranscript: boolean
}

const SourceContext = createContext<SourceContextType | undefined>(undefined)

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)

  useEffect(() => {
    const fetchTranscript = async () => {
      console.log("Fetching Transcipt 1")
      console.log("Selected Source:", JSON.stringify(selectedSource, null, 2))

      if (!selectedSource || selectedSource.fileType !== "audio") {
        console.log("Fetching Transcipt 2")
        setTranscript(null)
        return
      }

      try {
        setLoadingTranscript(true)
        console.log("Fetching Transcipt 3")

        // Extract the GCS path (e.g., "user-id/file-id.webm") from the URL
        const path = selectedSource.path

        const res = await getTranscript(selectedSource.sessionId)
        setTranscript(res.text)
      } catch (err) {
        console.error("Transcription failed:", err)
        setTranscript("Failed to transcribe.")
      } finally {
        setLoadingTranscript(false)
      }
    }

    fetchTranscript()
  }, [selectedSource])

  return (
    <SourceContext.Provider
      value={{
        selectedSource,
        setSelectedSource,
        transcript,
        loadingTranscript,
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
