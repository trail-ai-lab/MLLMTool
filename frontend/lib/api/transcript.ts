import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"

export async function getTranscript(sessionId: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/transcript/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Transcript not found")

  return res.json() as Promise<{
    text: string
    provider: string
    created_at?: string
  }>
}
