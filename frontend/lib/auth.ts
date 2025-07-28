import { getIdToken, signOut } from "firebase/auth"
import { auth } from "./firebase.client"

export async function getFirebaseToken(): Promise<string | null> {
  const user = auth.currentUser
  if (user) return await getIdToken(user, true)
  return null
}

export function logout() {
  signOut(auth)
}
