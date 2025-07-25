"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  getUploadUrl,
  uploadFileToGCS,
  saveFileMetadata,
} from "@/lib/api/upload"

import { v4 as uuidv4 } from "uuid"

type AddSourceDialogProps = {
  open: boolean
  onClose: () => void
}

export function AddSourceDialog({ open, onClose }: AddSourceDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    const sessionId = uuidv4()
    const groupId = "group-1" // TODO: replace with actual group ID from UI/context
    const topic = "Group discussion" // TODO: replace with actual topic from UI/context

    try {
      const { uploadUrl, path } = await getUploadUrl(file.type)

      await uploadFileToGCS(uploadUrl, file)

      await saveFileMetadata({
        sessionId,
        path,
        name: file.name,
        fileType: file.type.includes("audio") ? "audio" : "pdf",
        size: file.size,
        groupId,
        topic,
        status: "uploaded",
      })

      toast.success("File uploaded successfully")
      setFile(null)
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error("Upload failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Audio or PDF</DialogTitle>
        </DialogHeader>

        <input
          type="file"
          accept=".webm,.mp3,.wav,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-4 w-full"
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
