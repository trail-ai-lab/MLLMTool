// frontend/lib/api/onboard.ts
import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/constants" 

export async function triggerOnboarding(): Promise<void> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/onboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Onboarding failed")
}
