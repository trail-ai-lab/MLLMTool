"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, StopCircle } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import {
  getUploadUrl,
  uploadFileToGCS,
  saveFileMetadata,
} from "@/lib/api/sources"

type Props = {
  open: boolean
  onClose: () => void
}

export function RecordAudioDialog({ open, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<BlobPart[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"

      const recorder = new MediaRecorder(stream, { mimeType })

      audioChunks.current = []
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType })
        setAudioBlob(blob)
        if (audioRef.current) audioRef.current.src = URL.createObjectURL(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error("Microphone access error:", err)
      toast.error("Microphone permission denied or not available.")
    }
  }

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const uploadRecording = async () => {
    if (!audioBlob || !title.trim()) return
    setLoading(true)

    const file = new File([audioBlob], `${title.trim()}.webm`, {
      type: "audio/webm",
    })
    const sourceId = uuidv4()
    const groupId = "group-1"
    const topic = "Recorded Audio"

    try {
      const { uploadUrl, path } = await getUploadUrl(file.type)
      await uploadFileToGCS(uploadUrl, file)
      await saveFileMetadata({
        sourceId,
        path,
        name: file.name,
        fileType: "audio",
        size: file.size,
        groupId,
        topic,
        status: "uploaded",
      })

      toast.success("Recording uploaded successfully")
      setAudioBlob(null)
      setTitle("")
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
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording}>
              <StopCircle className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording} disabled={isRecording}>
              <Mic className="mr-2 h-5 w-5" />
              {audioBlob ? "Record Again" : "Start Recording"}
            </Button>
          )}

          {audioBlob && (
            <>
              <audio ref={audioRef} controls className="w-full" />
              <Input
                placeholder="Recording Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Button
                onClick={uploadRecording}
                disabled={!title.trim() || loading}
                className="w-full"
              >
                {loading ? "Uploading..." : "Upload Recording"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
