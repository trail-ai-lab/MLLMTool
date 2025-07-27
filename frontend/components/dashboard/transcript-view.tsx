import { useSource } from "@/lib/contexts/source-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

export default function TranscriptView() {
  const { transcript, loadingTranscript, summary, loadingSummary } = useSource()

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
            <p>{transcript}</p>
          ) : (
            <p>Transcript will be displayed here.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
