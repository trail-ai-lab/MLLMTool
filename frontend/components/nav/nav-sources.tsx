"use client"

import {
  Download,
  MoreHorizontal,
  Trash2,
  Pencil,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSource } from "@/lib/contexts/source-context"
import { deleteSource } from "@/lib/api/sources"

export function NavSources() {
  const { isMobile } = useSidebar()
  const {
    selectedSource,
    setSelectedSource,
    setShowRecorder,
    sources,
    loadingSources,
    removeSource,
  } = useSource()

  const handleDelete = async (sourceId: string) => {
    const confirmed = confirm("Are you sure you want to delete this source?")
    if (!confirmed) return

    try {
      await deleteSource(sourceId)
      // Remove from local state immediately
      removeSource(sourceId)
      // Clear selected source if it was the deleted one
      if (selectedSource?.sourceId === sourceId) {
        setSelectedSource(null)
      }
    } catch (err) {
      console.error("Failed to delete source:", err)
      alert("Failed to delete source")
    }
  }

  if (loadingSources) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Sources</SidebarGroupLabel>
      <SidebarMenu>
        {sources.map((item) => (
          <SidebarMenuItem key={item.sourceId}>
            <SidebarMenuButton
              asChild
              isActive={selectedSource?.sourceId === item.sourceId}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setShowRecorder(false)
                  setSelectedSource(item)
                }}
                className="flex items-center gap-2 w-full text-left justify-start px-2 py-1.5 rounded-md"
              >
                <item.icon className="size-4" />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Download className="text-muted-foreground" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="text-muted-foreground" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDelete(item.sourceId)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
