"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/nav/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import TranscriptView from "@/components/dashboard/transcript-view"
import { ChatView } from "@/components/dashboard/chat-view"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SourceProvider, useSource } from "@/lib/contexts/source-context"
import SummaryView from "@/components/dashboard/summary-view"
import AudioPlayback from "@/components/dashboard/audio-playback"
import { Separator } from "@/components/ui/separator"

function MainContent() {
  const { selectedSource } = useSource()

  if (!selectedSource) {
    return (
      <div className="p-6 text-muted-foreground">
        Please select a source to see the summary and transcription.
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40}>
          <div className="h-full flex flex-col overflow-hidden">
            <AudioPlayback />
            <ChatView />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <div className="h-full overflow-y-auto">
            <div className="space-y-4">
              <SummaryView />
              <Separator className="my-4" />
              <TranscriptView />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function Page() {
  return (
    <SourceProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="flex flex-col h-[calc(100vh-1rem)] overflow-hidden">
          <SiteHeader />
          <MainContent />
        </SidebarInset>
      </SidebarProvider>
    </SourceProvider>
  )
}
