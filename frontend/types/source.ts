import { type LucideIcon } from "lucide-react"

export type FileType = "audio" | "pdf"

export type SourceStatus = "uploaded" | "processing" | "completed" | "failed"

export interface BaseSource {
  sourceId: string
  path: string
  name: string
  fileType: FileType
  url: string
}

export interface Source extends BaseSource {
  icon: LucideIcon
}

export interface SourceMetadata {
  sourceId: string
  path: string
  name: string
  fileType: string
  size: number
  groupId?: string
  topic?: string
  status?: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  path: string
}

export interface SourceResponse {
  message: string
  sourceId: string
}

export interface DownloadUrlResponse {
  downloadUrl: string
}