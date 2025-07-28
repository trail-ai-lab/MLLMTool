import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"
import type { HighlightResponse, HighlightHistory } from "@/types"

export async function sendHighlightPrompt(sourceId: string, prompt: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/highlight/${sourceId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) throw new Error("Highlight failed")

  return res.json() as Promise<HighlightResponse>
}

export async function getHighlightHistory(sourceId: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(
    `${API_BASE_URL}/api/v1/highlight/${sourceId}/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) throw new Error("Failed to fetch highlight history")

  return res.json() as Promise<HighlightHistory>
}
