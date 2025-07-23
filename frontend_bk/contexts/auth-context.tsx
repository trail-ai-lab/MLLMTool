"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth"
import { auth } from "@/lib/firebaseClient"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Save token for auth header
    const token = await userCredential.user.getIdToken()
    localStorage.setItem("token", token)

    // Trigger onboarding (create user doc in Firestore)
    const { triggerOnboarding } = await import("@/lib/api/onboard")
    await triggerOnboarding()

    // // Optionally store the name (skip if not needed)
    // if (name) {
    //   await userCredential.user.updateProfile({ displayName: name })
    // }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
