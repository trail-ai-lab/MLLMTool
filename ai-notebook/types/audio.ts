export type Language = "en" | "es"

export interface AudioSource {
  id: string
  title: string
  type: "audio" | "pdf" | "transcript"
  duration?: string
  path: string
  file?: File
}

export interface Summary {
  text: {
    en: string
    es: string
  }
}

