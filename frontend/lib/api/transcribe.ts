import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"

export async function transcribeSource(path: string) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  console.log()

  const res = await fetch(`${API_BASE_URL}/api/v1/transcribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, provider: "groq" }),
  })

  if (!res.ok) throw new Error("Failed to transcribe audio")

  return res.json() as Promise<{ transcript: string; provider: string }>
}
