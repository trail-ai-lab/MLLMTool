export interface TranscriptResponse {
  text: string
  provider: string
  created_at?: string
}

export interface SummaryResponse {
  text: string
}

export interface TranscribeResponse {
  transcript: string
  provider: string
}

export interface HighlightResponse {
  prompt: string
  answer: string
  highlightedSentence: string
  created_at: string
}

export interface HighlightHistoryItem {
  prompt: string
  answer: string
  highlightedSentence: string
  created_at: string
}

export type HighlightHistory = HighlightHistoryItem[]