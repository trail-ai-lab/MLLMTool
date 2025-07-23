"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotebookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white dark:bg-gray-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">AI Notebook</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 