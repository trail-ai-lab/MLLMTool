"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, StopCircle, UploadCloud, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { useRouter } from "next/navigation"
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
import {
  AUDIO_MIME_TYPE,
  FALLBACK_AUDIO_MIME_TYPE,
  DEFAULT_GROUP_ID,
  DEFAULT_RECORDED_TOPIC,
  RECORDING_WARMUP_DELAY,
  TIMER_INTERVAL,
} from "@/lib/constants"

export function RecorderView({ onComplete }: { onComplete?: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<BlobPart[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { setSelectedSource, addSource, sources } = useSource()
  const router = useRouter()

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!audioBlob || !audioRef.current) return
    const url = URL.createObjectURL(audioBlob)
    audioRef.current.src = url
    audioRef.current.load()
  }, [audioBlob])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
        ? AUDIO_MIME_TYPE
        : FALLBACK_AUDIO_MIME_TYPE

      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunks.current = []

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType })
        setAudioBlob(blob)
      }

      mediaRecorderRef.current = recorder
      setElapsedTime(0)
      setIsRecording(true)

      // ✅ Warm-up delay to ensure mic is ready
      setTimeout(() => {
        recorder.start()
        timerRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1)
        }, TIMER_INTERVAL)
      }, RECORDING_WARMUP_DELAY)
    } catch (err) {
      console.error("Microphone access error:", err)
      toast.error("Microphone permission denied or not available.")
    }
  }

  const stopRecording = () => {
    console.log("Stop button clicked")

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop())
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
  }

  const uploadRecording = async () => {
    if (!audioBlob || !title.trim()) return

    const trimmedName = `${title.trim()}.webm`

    const isDuplicate = sources.some((source) => source.name === trimmedName)
    if (isDuplicate) {
      toast.error(
        "A recording with this title already exists. Please choose a different title."
      )
      return
    }

    setLoading(true)
    const file = new File([audioBlob], trimmedName, {
      type: "audio/webm",
    })
    const sourceId = uuidv4()
    const groupId = DEFAULT_GROUP_ID
    const topic = DEFAULT_RECORDED_TOPIC

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

      const newSource = {
        sourceId,
        path,
        name: file.name,
        fileType: "audio" as const,
        url: "",
      }

      addSource(newSource)
      setSelectedSource({
        ...newSource,
        icon: Mic,
      })

      // Navigate to the new source
      router.push(`/source/${sourceId}`)
      onComplete?.()
      setAudioBlob(null)
      setTitle("")
      setElapsedTime(0)
    } catch (err: any) {
      console.error(err)
      toast.error("Upload failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-xl bg-muted/40  bg-transparent shadow-md min-h-[500px] flex flex-col">
        <CardHeader className="flex flex-col items-center justify-center gap-1">
          <span
            className={`text-sm ${
              isRecording
                ? "text-destructive animate-pulse"
                : "text-muted-foreground"
            }`}
          >
            {isRecording
              ? "Recording..."
              : audioBlob
              ? "Recording complete. Upload to generate transcript."
              : "Press the button to start recording"}
          </span>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-center">
          {!audioBlob ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl font-bold text-card-foreground pb-8">
                {formatElapsedTime(elapsedTime)}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    isRecording ? stopRecording() : startRecording()
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition 
  ${
    isRecording
      ? "bg-destructive text-white"
      : "bg-white text-black hover:ring-2 hover:ring-muted-foreground/20"
  }
`}
                >
                  {isRecording ? (
                    <StopCircle className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                {isRecording && (
                  <span className="absolute -inset-1 animate-ping rounded-full border-2 border-destructive opacity-75 pointer-events-none"></span>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-8">
              <audio
                ref={audioRef}
                controls
                className="w-full rounded-md"
                onError={() =>
                  toast.error("Failed to load recorded audio preview.")
                }
              />
              <div className="space-y-2">
                <Label htmlFor="title">Recording Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your recording"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>

        {audioBlob && (
          <CardFooter className="flex flex-col gap-3 mt-4">
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
                setElapsedTime(0)
              }}
            >
              Record Again
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
