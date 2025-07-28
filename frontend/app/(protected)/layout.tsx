// app/(protected)/layout.tsx
"use client"

import { useAuth } from "@/lib/useAuth"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/nav/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SourceProvider } from "@/lib/contexts/source-context"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-[280px] p-4 border-r">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-[80%] mb-2" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    )
  }
  if (!user) return redirect("/login")

  return (
    <SourceProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="flex flex-col h-[calc(100vh-1rem)] overflow-hidden">
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SourceProvider>
  )
}
