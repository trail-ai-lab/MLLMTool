// lib/getIdToken.ts

import { auth } from "@/lib/firebaseClient"

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return await user.getIdToken()
}
