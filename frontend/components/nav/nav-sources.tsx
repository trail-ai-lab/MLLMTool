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
import { cn } from "@/lib/utils"

export function NavSources({
  sources,
}: {
  sources: {
    name: string
    url: string
    path: string
    fileType: "audio" | "pdf"
    icon: LucideIcon
    sourceId: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const { selectedSource, setSelectedSource } = useSource()
  const router = useRouter()

  const handleDelete = async (sourceId: string) => {
    const confirmed = confirm("Are you sure you want to delete this source?")
    if (!confirmed) return

    try {
      await deleteSource(sourceId)
      router.refresh?.() // Refresh the list after deletion
    } catch (err) {
      console.error("Failed to delete source:", err)
      alert("Failed to delete source")
    }
  }

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
                  setSelectedSource(item)
                }}
                className="flex items-center gap-2 w-full text-left justify-between px-2 py-1.5 rounded-md"
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
