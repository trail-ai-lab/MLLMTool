"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useSource } from "@/lib/contexts/source-context"
import TranscriptView from "@/components/dashboard/transcript-view"
import { ChatView } from "@/components/dashboard/chat-view"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import SummaryView from "@/components/dashboard/summary-view"
import AudioPlayback from "@/components/dashboard/audio-playback"
import { Separator } from "@/components/ui/separator"

export default function SourcePage() {
  const params = useParams()
  const sourceId = params.id as string
  const { sources, setSelectedSource, selectedSource } = useSource()

  useEffect(() => {
    if (sourceId && sources.length > 0) {
      const source = sources.find((s) => s.sourceId === sourceId)
      if (source && source.sourceId !== selectedSource?.sourceId) {
        setSelectedSource(source)
      }
    }
  }, [sourceId, sources, setSelectedSource, selectedSource])

  if (!selectedSource || selectedSource.sourceId !== sourceId) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50}>
        <div className="h-full flex flex-col overflow-hidden">
          <AudioPlayback />
          <ChatView />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="h-full overflow-y-auto">
          <div className="space-y-4">
            <SummaryView />
            <Separator className="my-4" />
            <TranscriptView />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
