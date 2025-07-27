import React from "react"
import { useSource } from "@/lib/contexts/source-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

export default function TranscriptView() {
  const { transcript, loadingTranscript, summary, loadingSummary } = useSource()
  const [highlighted, setHighlighted] = React.useState<string | null>(null)

  // Listen for sentence highlight events
  React.useEffect(() => {
    const handler = (e: CustomEvent) => {
      setHighlighted(e.detail)
    }

    window.addEventListener("highlight-sentence", handler as EventListener)
    return () => {
      window.removeEventListener("highlight-sentence", handler as EventListener)
    }
  }, [])

  const renderTranscript = () => {
    if (!transcript) return null
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript]

    return sentences.map((sentence, i) => {
      const trimmed = sentence.trim()
      const isMatch = highlighted && trimmed.includes(highlighted)

      return (
        <span key={i} className={isMatch ? "bg-yellow-200 font-semibold" : ""}>
          {trimmed}{" "}
        </span>
      )
    })
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <Card>
        <CardContent>
          <h4 className="text-lg font-semibold mb-4">Summary</h4>
          {loadingSummary ? (
            <p>Summarizing...</p>
          ) : summary ? (
            <p>{summary}</p>
          ) : (
            <p>Summary will be displayed here.</p>
          )}
        </CardContent>
      </Card>

      <Separator className="mb-4 mt-4" />

      <h4 className="text-lg font-semibold mb-4">Transcript</h4>
      <ScrollArea className="pr-2">
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          {loadingTranscript ? (
            <p>Transcribing audio...</p>
          ) : transcript ? (
            <p>{renderTranscript()}</p>
          ) : (
            <p>Transcript will be displayed here.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
