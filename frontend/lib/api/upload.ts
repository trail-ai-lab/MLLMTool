//frontend/lib/api/upload.ts

import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"

export async function getUploadUrl(contentType: string = "application/pdf") {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/upload/upload-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }), // optional
  })

  if (!res.ok) throw new Error("Failed to get upload URL")

  return res.json() as Promise<{ uploadUrl: string; path: string }>
}

export async function uploadFileToGCS(uploadUrl: string, file: File) {
  console.log()
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  })

  if (!res.ok) throw new Error("GCS upload failed")
}

export async function saveFileMetadata(metadata: {
  sessionId: string
  path: string
  name: string
  fileType: string
  size: number
  groupId?: string
  topic?: string
  status?: string
}) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/upload/upload-metadata`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  })

  if (!res.ok) throw new Error("Failed to save metadata")

  return res.json() as Promise<{ message: string; sessionId: string }>
}
