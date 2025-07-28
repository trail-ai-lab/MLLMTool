"use client"

import { useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Mic, FileText, FileIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

import {
  getUploadUrl,
  uploadFileToGCS,
  saveFileMetadata,
} from "@/lib/api/sources"
import { useSource } from "@/lib/contexts/source-context"
import {
  ACCEPTED_FILE_TYPES,
  DEFAULT_GROUP_ID,
  DEFAULT_TOPIC,
  BYTES_TO_KB,
} from "@/lib/constants"
import type { FileType } from "@/types"

export function AddSourceView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [customName, setCustomName] = useState("")

  const { addSource, setSelectedSource, sources } = useSource()
  const router = useRouter()

  const handleUpload = async () => {
    if (!file) return

    const isDuplicate = sources.some((source) => source.name === file.name)
    if (isDuplicate) {
      toast.error(
        "A file with this name already exists. Please rename it before uploading."
      )
      return
    }

    setLoading(true)
    const sourceId = uuidv4()
    const groupId = DEFAULT_GROUP_ID
    const topic = DEFAULT_TOPIC

    try {
      const { uploadUrl, path } = await getUploadUrl(file.type)
      await uploadFileToGCS(uploadUrl, file)

      const fileType: FileType = file.type.startsWith("audio")
        ? "audio"
        : "pdf"

      await saveFileMetadata({
        sourceId,
        path,
        name: customName.trim() || file.name,
        fileType,
        size: file.size,
        groupId,
        topic,
        status: "uploaded",
      })

      const newSource = {
        sourceId,
        path,
        name: customName.trim() || file.name,
        fileType,
        url: "",
        icon: fileType === "audio" ? Mic : FileText,
      }

      addSource(newSource)
      setSelectedSource(newSource)
      toast.success("File uploaded successfully")
      setFile(null)
      // Navigate to the new source
      router.push(`/source/${sourceId}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Upload failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const triggerFileDialog = () => fileInputRef.current?.click()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-xl bg-transparent shadow-md">
        <CardContent className="p-6 space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition ${
              isDragging ? "bg-gray-100 border-gray-400" : "border-gray-200"
            }`}
            onClick={triggerFileDialog}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const droppedFile = e.dataTransfer.files?.[0]
              if (droppedFile) {
                setFile(droppedFile)
              }
            }}
          >
            <FileIcon className="w-12 h-12 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              Drag and drop a file or click to browse
            </span>
            <span className="text-xs text-gray-500">
              PDF or audio files only (.pdf, .webm, .mp3, .wav)
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <Label htmlFor="file" className="text-sm font-medium">
              File
            </Label>

            {/* Hidden file input */}
            <Input
              id="file"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0]
                if (selected) {
                  const nameWithoutExtension = selected.name.replace(
                    /\.[^/.]+$/,
                    ""
                  )
                  setFile(selected)
                  setCustomName(nameWithoutExtension)
                }
              }}
            />

            {/* Show file rename input or "No file selected" */}
            {file ? (
              <>
                <Label htmlFor="filename">Rename file (optional)</Label>
                <Input
                  id="filename"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Original: <strong>{file.name}</strong> (
                  {Math.round(file.size / BYTES_TO_KB)} KB)
                </p>
              </>
            ) : (
              <p className="text-gray-500">No file selected</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            size="lg"
            className="w-full"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
