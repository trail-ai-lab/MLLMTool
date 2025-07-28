"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./model-toggle"
import { useSource } from "@/lib/contexts/source-context"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const { selectedSource } = useSource()
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname === "/recorder") return "Record Audio"
    if (pathname === "/add-source") return "Add Source"
    if (pathname.startsWith("/source/") && selectedSource) return selectedSource.name
    return "Dashboard"
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <h1 className="text-base font-medium">
            {getTitle()}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://trail.wcer.wisc.edu/"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              TRAIL Lab
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
