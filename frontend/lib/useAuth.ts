// src/lib/useAuth.ts
import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut, User } from "firebase/auth"
import { auth } from "./firebase.client"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
    window.location.href = "/login" // redirect after logout
  }

  return { user, loading, logout }
}
