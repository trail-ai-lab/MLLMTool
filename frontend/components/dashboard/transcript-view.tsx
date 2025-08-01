"use client"

import React from "react"
import { useSource } from "@/lib/contexts/source-context"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function TranscriptView() {
  const { transcript, loadingTranscript } = useSource()
  const [highlighted, setHighlighted] = React.useState<string | null>(null)
  const sentenceRefs = React.useRef<Map<number, HTMLSpanElement | null>>(
    new Map()
  )

  React.useEffect(() => {
    if (!highlighted) return

    setTimeout(() => {
      for (const [i, ref] of sentenceRefs.current.entries()) {
        if (!ref) continue
        const normalizedSentence = ref.textContent
          ?.trim()
          .replace(/\s+/g, " ")
          .toLowerCase()
        const normalizedHighlight = highlighted
          .replace(/\s+/g, " ")
          .toLowerCase()

        if (
          normalizedSentence &&
          (normalizedSentence.includes(normalizedHighlight) ||
            normalizedHighlight.includes(normalizedSentence))
        ) {
          ref.scrollIntoView({ behavior: "smooth", block: "center" })
          break
        }
      }
    }, 50)
  }, [highlighted])

  React.useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      setHighlighted(customEvent.detail)
    }

    window.addEventListener("highlight-sentence", handler)
    return () => {
      window.removeEventListener("highlight-sentence", handler)
    }
  }, [])

  const renderTranscript = () => {
    if (!transcript) return null

    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript]

    return sentences.map((sentence, i) => {
      const trimmed = sentence.trim()
      let isMatch = false

      if (highlighted) {
        const normalizedSentence = trimmed.replace(/\s+/g, " ").toLowerCase()
        const normalizedHighlight = highlighted
          .replace(/\s+/g, " ")
          .toLowerCase()

        isMatch =
          normalizedSentence.includes(normalizedHighlight) ||
          normalizedHighlight.includes(normalizedSentence)
      }

      return (
        <span
          key={i}
          ref={(el) => {
            sentenceRefs.current.set(i, el)
          }}
          className={cn(
            "rounded px-1",
            isMatch && "bg-yellow-200 text-black font-semibold"
          )}
        >
          {trimmed}{" "}
        </span>
      )
    })
  }

  return (
    <Card className="m-4 overflow-visible relative">
      <CardContent>
        <h4 className="text-lg font-semibold mb-4">Transcript</h4>
        <div className="space-y-4 text-sm leading-relaxed">
          {loadingTranscript ? (
            <p>Transcribing audio...</p>
          ) : transcript ? (
            <p>{renderTranscript()}</p>
          ) : (
            <p>Transcript will be displayed here.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
