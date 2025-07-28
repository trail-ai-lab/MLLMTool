import { IconUpload, IconPlayerRecord } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSource } from "@/lib/contexts/source-context"

export function NavMain() {
  const { setSelectedSource, setShowRecorder, setShowAddSource } = useSource()

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
                setShowAddSource(false)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90 min-w-8 duration-200 ease-linear"
            >
              <IconPlayerRecord stroke={2} />
              <span>Record Audio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Add Source"
              onClick={() => {
                setSelectedSource(null)
                setShowRecorder(false)
                setShowAddSource(true)
              }}
            >
              <IconUpload />
              <span>Add Source</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
