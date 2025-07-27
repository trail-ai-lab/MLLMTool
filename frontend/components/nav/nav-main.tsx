"use client"

import { IconUpload, IconPlayerRecord } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { AddSourceDialog } from "@/components/dialogs/add-source-dialog"
import { useState } from "react"
import { useSource } from "@/lib/contexts/source-context"

export function NavMain({}: {}) {
  const [openUpload, setOpenUpload] = useState(false)
  const [openRecord, setOpenRecord] = useState(false)
  const { setSelectedSource, setShowRecorder } = useSource()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Record Audio"
              onClick={() => {
                setSelectedSource(null)
                setShowRecorder(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconPlayerRecord stroke={2} />
              <span>Record Audio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Add Source"
              onClick={() => setOpenUpload(true)}
            >
              <IconUpload />
              <span>Add Source</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <AddSourceDialog
            open={openUpload}
            onClose={() => setOpenUpload(false)}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
