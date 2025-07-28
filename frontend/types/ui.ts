export type MessageRole = "user" | "agent"

export interface Message {
  role: MessageRole
  content: string
  highlight?: string
}

export interface SourceContextType {
  selectedSource: import("./source").Source | null
  setSelectedSource: (source: import("./source").Source | null) => void
  transcript: string | null
  loadingTranscript: boolean
  summary: string | null
  loadingSummary: boolean
  sources: import("./source").Source[]
  loadingSources: boolean
  refreshSources: () => void
  addSource: (source: import("./source").BaseSource) => void
  removeSource: (sourceId: string) => void
}