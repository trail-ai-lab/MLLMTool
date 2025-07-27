import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants"

export async function getSummary(sourceId: string, tool: string = "slai") {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(
    `${API_BASE_URL}/api/v1/tools/${tool}/summary/${sourceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) throw new Error("Failed to fetch summary")

  return res.json() as Promise<{ text: string }>
}
