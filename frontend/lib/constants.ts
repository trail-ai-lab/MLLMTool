export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// File upload constants
export const ACCEPTED_FILE_TYPES = ".webm,.mp3,.wav,.pdf"
export const ACCEPTED_MIME_TYPES = {
  AUDIO: ["audio/webm", "audio/mp3", "audio/wav"],
  PDF: ["application/pdf"]
} as const

export const AUDIO_MIME_TYPE = "audio/webm;codecs=opus"
export const FALLBACK_AUDIO_MIME_TYPE = "audio/webm"

// Default values
export const DEFAULT_GROUP_ID = "group-1"
export const DEFAULT_TOPIC = "Group discussion"
export const DEFAULT_RECORDED_TOPIC = "Recorded Audio"

// File size constants
export const BYTES_TO_KB = 1024

// Recording constants
export const RECORDING_WARMUP_DELAY = 400 // milliseconds
export const TIMER_INTERVAL = 1000 // milliseconds
