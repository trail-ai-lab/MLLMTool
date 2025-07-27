"use client"

import React, { useEffect, useState } from "react"
import { getDownloadUrl } from "@/lib/api/sources"
import { useSource } from "@/lib/contexts/source-context"

export default function AudioPlayback() {
  const { selectedSource } = useSource()
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAudio = async () => {
      setAudioUrl(null)
      setError(null)

      if (!selectedSource || selectedSource.fileType !== "audio") return

      try {
        setLoading(true)
        const { downloadUrl } = await getDownloadUrl(selectedSource.path)
        setAudioUrl(downloadUrl)
      } catch (err) {
        console.error("Failed to load audio:", err)
        setError("Failed to load audio for playback.")
      } finally {
        setLoading(false)
      }
    }

    fetchAudio()
  }, [selectedSource])

  if (!selectedSource || selectedSource.fileType !== "audio") return null

  return (
    <div className="p-4 border-b">
      {loading && (
        <p className="text-sm text-muted-foreground">Loading audio...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {audioUrl && (
        <audio
          controls
          className="w-full"
          src={audioUrl}
          onError={() => setError("Audio playback failed.")}
        />
      )}
    </div>
  )
}
