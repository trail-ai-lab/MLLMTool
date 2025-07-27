import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"

// Generate a signed URL for uploading to GCS
export async function getUploadUrl(contentType: string = "application/pdf") {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/sources/upload-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  })

  if (!res.ok) throw new Error("Failed to get upload URL")

  return res.json() as Promise<{ uploadUrl: string; path: string }>
}

// Upload the actual file to GCS using the signed URL
export async function uploadFileToGCS(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  })

  if (!res.ok) throw new Error("GCS upload failed")
}

// Save metadata for uploaded file in Firestore
export async function saveFileMetadata(metadata: {
  sourceId: string
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

  const res = await fetch(`${API_BASE_URL}/api/v1/sources/upload-metadata`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  })

  if (!res.ok) throw new Error("Failed to save metadata")

  return res.json() as Promise<{ message: string; sourceId: string }>
}

// Fetch all uploaded file metadata (audio + pdf) for the current user
export async function getSources() {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/sources`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to fetch sources")

  return res.json() as Promise<
    {
      sourceId: string
      name: string
      fileType: "audio" | "pdf"
      url: string
      path: string
    }[]
  >
}

// Delete a specific source by sourceId
export async function deleteSource(sourceId: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/sources/${sourceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to delete source")

  return res.json() as Promise<{ message: string; sourceId: string }>
}

export async function getDownloadUrl(path: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/sources/download-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  })

  if (!res.ok) throw new Error("Failed to get download URL")
  return res.json() as Promise<{ downloadUrl: string }>
}
