// apps/frontend/src/components/app-sidebar.tsx

"use client"

import * as React from "react"
import { useState } from "react"
import { IconSettings, IconHelp, IconInnerShadowTop } from "@tabler/icons-react"

import { NavMain } from "@/components/sidebar-nav/nav-main"
import { NavSecondary } from "@/components/sidebar-nav/nav-secondary"
import { NavUser } from "@/components/sidebar-nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & {}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">SLAI</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
