// apps/frontend/components/app-sidebar.tsx

"use client"

import * as React from "react"
import { useState } from "react"
import { IconSettings, IconHelp } from "@tabler/icons-react"
import Image from "next/image"

import { NavMain } from "@/components/nav/nav-main"
import { NavSources } from "@/components/nav/nav-sources"
import { NavSecondary } from "@/components/nav/nav-secondary"
import { NavUser } from "@/components/nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FileText, Music } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSources } from "@/lib/hooks/use-sources"

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & {}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { sources, loading } = useSources()

  const navSecondary = [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      onClick: () => setIsSettingsOpen(true),
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ]
  const mappedSources = sources.map((s) => ({
    name: s.name,
    url: `/dashboard/${s.sessionId}`,
    icon: s.fileType === "pdf" ? FileText : Music,
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Image
                  src="/logo/trail-logo.svg"
                  alt="TRAIL Logo"
                  width={24}
                  height={24}
                  priority
                  className="invert-0 dark:invert"
                />
                <span className="text-base font-semibold">SLAI</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {loading ? (
          <div className="px-3 space-y-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <NavSources sources={mappedSources} />
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
