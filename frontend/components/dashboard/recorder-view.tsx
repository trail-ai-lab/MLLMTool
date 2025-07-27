"use client"

import { useState, useRef, useEffect } from "react"
import {
  Mic,
  StopCircle,
  UploadCloud,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  getUploadUrl,
  uploadFileToGCS,
  saveFileMetadata,
} from "@/lib/api/sources"
import { useSource } from "@/lib/contexts/source-context"

export function RecorderView({ onComplete }: { onComplete?: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<BlobPart[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { setShowRecorder, setSelectedSource } = useSource()

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop())
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
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob)
        }
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
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop())
    setIsRecording(false)
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

      setSelectedSource({
        sourceId,
        path,
        name: file.name,
        fileType: "audio",
        url: "", // optional: use downloadUrl
        icon: Mic,
      })

      setShowRecorder(false)
      onComplete?.()
      setAudioBlob(null)
      setTitle("")
    } catch (err: any) {
      console.error(err)
      toast.error("Upload failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto bg-muted/40 border border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-medium">Audio Recorder</h2>
        {isRecording && (
          <span className="text-sm text-destructive animate-pulse">
            Recording...
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!audioBlob ? (
          <div className="flex items-center justify-center gap-4">
            {isRecording ? (
              <Button variant="destructive" size="lg" onClick={stopRecording}>
                <StopCircle className="mr-2 h-5 w-5" />
                Stop
              </Button>
            ) : (
              <Button variant="default" size="lg" onClick={startRecording}>
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            )}
          </div>
        ) : (
          <>
            <audio ref={audioRef} controls className="w-full rounded-md" />
            <div className="space-y-2">
              <Label htmlFor="title">Recording Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your recording"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </>
        )}
      </CardContent>

      {audioBlob && (
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={uploadRecording}
            disabled={!title.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Recording
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm underline"
            onClick={() => {
              setAudioBlob(null)
              setTitle("")
            }}
          >
            Record Again
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
