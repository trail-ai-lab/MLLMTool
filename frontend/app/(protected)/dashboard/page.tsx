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
import { RecorderView } from "@/components/dashboard/recorder-view"
import { AddSourceView } from "@/components/dashboard/add-source-view"

function MainContent() {
  const { selectedSource, showRecorder, showAddSource } = useSource()

  if (showAddSource) return <AddSourceView />
  if (showRecorder) return <RecorderView />

  return selectedSource ? (
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
  ) : (
    <RecorderView />
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
