"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Mic,
  Share,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react"
import { SettingsDialog } from "./settings-dialog"
import { useLanguage } from "../contexts/language-context"
import type { AudioSource } from "../types/audio"
import { fetchLLMResponse } from "@/lib/groqApi"
import { RecordSourceDialog } from "@/components/record-source-dialog"
import { transcribeAudio } from "@/lib/transcribe"
import { summarizeTranscript } from "@/lib/summarize"
import CustomPDFViewer from "@/components/CustomPDFViewer"
import {
  saveSource,
  saveSourceData,
  getSourceData,
  deleteSource,
  getSignedAudioUrl,
} from "@/lib/supabaseClient"
import { getGroqHighlights, combineHighlights } from "@/lib/groqHighlightUtils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Highlight {
  index: number
  text: string
  score: number
}

interface MergedHighlight {
  start_index: number
  end_index: number
  text: string
  avg_score: number
}

interface QueryResponse {
  answer: string
  confidence: number
  highlights: Highlight[]
  merged_highlights: MergedHighlight[]
}

const API_URL = process.env.NEXT_PUBLIC_BACKENDURL

async function queryBackend(
  question: string,
  context: string
): Promise<QueryResponse> {
  try {
    const response = await fetch(`${API_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        context,
        threshold: 0.7,
        max_highlight_sentences: 3,
        chunk_size: 4,
        chunk_overlap: 2,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error querying backend:", error)
    throw error
  }
}

// Update the local Source interface
interface Source {
  id: string
  title: string
  type: "audio" | "pdf" | "transcript"
  duration?: string
  path: string
  file?: File
}

const INITIAL_SOURCES: Source[] = []

interface SourceCache {
  [sourceId: string]: {
    transcript?: string
    summary?: string
    textContent?: string
  }
}

interface NotebookProps {
  initialSources?: Source[]
  isLoadingSources?: boolean
}

const Notebook = ({
  initialSources = INITIAL_SOURCES,
  isLoadingSources = false,
}: NotebookProps) => {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const { language } = useLanguage()
  const [textContent, setTextContent] = useState<string>("")
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedSources, setProcessedSources] = useState<Set<string>>(
    new Set()
  )
  const [sourceCache, setSourceCache] = useState<SourceCache>({})
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null)
  const [audioLoadingError, setAudioLoadingError] = useState<string | null>(
    null
  )
  const [audioLoadingStatus, setAudioLoadingStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle")
  const [audioSrc, setAudioSrc] = useState<string>("")

  // Update sources when initialSources change (user's sources from database)
  useEffect(() => {
    if (initialSources && initialSources.length > 0) {
      setSources(initialSources)
      // Select the first source if none is selected
      if (!selectedSource && initialSources.length > 0) {
        setSelectedSource(initialSources[0])
      }
    }
  }, [initialSources, selectedSource])

  // Add this useEffect to handle audio player creation and cleanup
  useEffect(() => {
    const setupAudioPlayer = async () => {
      if (selectedSource?.type === "audio" && selectedSource.path) {
        // Clean up any previous audio player
        if (audioPlayer) {
          audioPlayer.pause()
          audioPlayer.src = ""
          audioPlayer.removeEventListener("loadedmetadata", () => {})
          audioPlayer.removeEventListener("error", () => {})
        }

        // Create a new audio player with the current source
        const newPlayer = new Audio()

        // Add event listeners before setting src
        const handleLoadedMetadata = () => {
          console.log("Audio loaded successfully:", selectedSource.path)
          setAudioLoadingStatus("loaded")
          setAudioLoadingError(null)
        }

        const handleCanPlay = () => {
          console.log("Audio can start playing")
          setAudioLoadingStatus("loaded")
        }

        const handleError = (e: Event) => {
          console.error("Audio loading error:", e)
          console.error("Failed to load audio from:", selectedSource.path)

          setAudioLoadingStatus("error")

          let errorMessage = "Failed to load audio file"

          // Check if it's a Supabase URL and suggest potential fixes
          if (selectedSource.path.includes("supabase")) {
            errorMessage =
              "Supabase audio loading failed. Possible causes: file permissions, bucket configuration, file format, or network issues."
            console.error(
              "Supabase audio loading failed. This might be due to:"
            )
            console.error("1. File permissions (RLS policies)")
            console.error("2. Bucket configuration")
            console.error("3. File format compatibility")
            console.error("4. Network connectivity")
          }

          setAudioLoadingError(errorMessage)
        }

        const handleLoadStart = () => {
          console.log("Audio loading started:", selectedSource.path)
          setAudioLoadingStatus("loading")
          setAudioLoadingError(null)
        }

        newPlayer.addEventListener("loadedmetadata", handleLoadedMetadata)
        newPlayer.addEventListener("error", handleError)
        newPlayer.addEventListener("loadstart", handleLoadStart)
        newPlayer.addEventListener("canplay", handleCanPlay)

        // Set crossOrigin before src to handle CORS
        newPlayer.crossOrigin = "anonymous"

        // Get signed URL for Supabase files, or use original path for others
        let audioUrl = selectedSource.path
        if (selectedSource.path.includes("supabase")) {
          try {
            const signedUrl = await getSignedAudioUrl(selectedSource.path)
            if (signedUrl) {
              audioUrl = signedUrl
              console.log("Using signed URL for audio playback")
            }
          } catch (error) {
            console.error("Error getting signed URL, using original:", error)
          }
        }

        // Set the source
        newPlayer.src = audioUrl
        setAudioSrc(audioUrl)

        // Preload metadata
        newPlayer.preload = "metadata"

        setAudioPlayer(newPlayer)

        // Cleanup function for this effect
        return () => {
          newPlayer.removeEventListener("loadedmetadata", handleLoadedMetadata)
          newPlayer.removeEventListener("error", handleError)
          newPlayer.removeEventListener("loadstart", handleLoadStart)
          newPlayer.removeEventListener("canplay", handleCanPlay)
          newPlayer.pause()
          newPlayer.src = ""
        }
      } else {
        // Clean up audio player if no audio source is selected
        if (audioPlayer) {
          audioPlayer.pause()
          audioPlayer.src = ""
          setAudioPlayer(null)
        }
        setAudioSrc("")
        setAudioLoadingStatus("idle")
        setAudioLoadingError(null)
      }
    }

    setupAudioPlayer()
  }, [selectedSource?.path, selectedSource?.type])

  // Add a function to get text content from PDF viewer and cache it
  const setPDFTextContent = (content: string) => {
    if (!selectedSource) return

    setTextContent(content)

    // Update cache with the new text content
    setSourceCache((prev) => ({
      ...prev,
      [selectedSource.id]: {
        ...prev[selectedSource.id],
        textContent: content,
      },
    }))

    // Save to localStorage
    try {
      localStorage.setItem(`source_textContent_${selectedSource.id}`, content)
    } catch (error) {
      console.warn("Could not save PDF text content to localStorage:", error)
    }
  }

  // Load cache from localStorage on component mount
  useEffect(() => {
    try {
      // Load processed sources from localStorage
      const savedProcessedSources = localStorage.getItem("processedSources")
      if (savedProcessedSources) {
        setProcessedSources(new Set(JSON.parse(savedProcessedSources)))
      }

      // Load source cache data
      const tempCache: SourceCache = {}

      // Scan all localStorage items for our cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        if (key.startsWith("source_transcript_")) {
          const sourceId = key.replace("source_transcript_", "")
          tempCache[sourceId] = tempCache[sourceId] || {}
          tempCache[sourceId].transcript =
            localStorage.getItem(key) || undefined
        } else if (key.startsWith("source_summary_")) {
          const sourceId = key.replace("source_summary_", "")
          tempCache[sourceId] = tempCache[sourceId] || {}
          tempCache[sourceId].summary = localStorage.getItem(key) || undefined
        } else if (key.startsWith("source_textContent_")) {
          const sourceId = key.replace("source_textContent_", "")
          tempCache[sourceId] = tempCache[sourceId] || {}
          tempCache[sourceId].textContent =
            localStorage.getItem(key) || undefined
        }
      }

      setSourceCache(tempCache)
    } catch (error) {
      console.warn("Error loading cache from localStorage:", error)
    }
  }, [])

  // Function to save source data to Supabase
  const saveSourceDataToSupabase = async (
    sourceId: string,
    data: {
      transcript?: string
      summary?: string
      textContent?: string
    }
  ) => {
    try {
      await saveSourceData(sourceId, data)
    } catch (error) {
      console.error("Error saving source data to Supabase:", error)
    }
  }

  // When transcription and summary are generated, save them to Supabase
  useEffect(() => {
    if (selectedSource && transcript && summary) {
      saveSourceDataToSupabase(selectedSource.id, {
        transcript,
        summary,
      })
    }
  }, [selectedSource, transcript, summary])

  // When PDF text content is processed, save it to Supabase
  useEffect(() => {
    if (
      selectedSource?.type === "pdf" &&
      textContent &&
      textContent.length > 0
    ) {
      saveSourceDataToSupabase(selectedSource.id, {
        textContent,
      })
    }
  }, [selectedSource, textContent])

  // Load source data when source is selected
  const loadSourceData = async (source: Source) => {
    try {
      const data = await getSourceData(source.id)

      if (data) {
        if (data.transcript) {
          setTranscript(data.transcript)

          setSourceCache((prev) => ({
            ...prev,
            [source.id]: {
              ...prev[source.id],
              transcript: data.transcript,
            },
          }))
        }

        if (data.summary) {
          setSummary(data.summary)

          setSourceCache((prev) => ({
            ...prev,
            [source.id]: {
              ...prev[source.id],
              summary: data.summary,
            },
          }))
        }

        if (data.text_content) {
          setTextContent(data.text_content)

          setSourceCache((prev) => ({
            ...prev,
            [source.id]: {
              ...prev[source.id],
              textContent: data.text_content,
            },
          }))
        }
      }
    } catch (error) {
      console.error("Error loading source data:", error)
    }
  }

  // Modify the existing fetchTranscriptAndSummary function
  const fetchTranscriptAndSummary = async (source: Source) => {
    if (source.type !== "audio") return

    // First try to load from Supabase
    await loadSourceData(source)

    // If we have data in the cache, use it
    if (sourceCache[source.id]?.transcript) {
      setTranscript(sourceCache[source.id].transcript || null)
      if (sourceCache[source.id]?.summary) {
        setSummary(sourceCache[source.id].summary || null)
      }
      return
    }

    // Prevent duplicate processing
    if (isTranscribing) {
      console.log(
        "Already transcribing another file, will not start a new transcription"
      )
      return
    }

    // Otherwise, proceed with transcription
    setIsTranscribing(true)
    setTranscript("Generating transcript... This may take a few minutes.")
    setSummary("Waiting for transcript to complete...")

    try {
      let audioFile: File | null = null
      try {
        console.log("Fetching audio from:", source.path)

        // For Supabase storage URLs, use Supabase to download directly
        if (source.path.includes("supabase")) {
          try {
            console.log("Accessing Supabase file:", source.path)

            // Extract the file path differently - this is the key fix
            // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            const urlParts = source.path.split("/public/")
            if (urlParts.length < 2) {
              throw new Error("Invalid Supabase storage URL format")
            }

            const pathParts = urlParts[1].split("/")
            const bucketName = pathParts[0] // This should be 'audio_files' or 'pdf_files'
            const objectPath = pathParts.slice(1).join("/")

            console.log(
              `Downloading from bucket: ${bucketName}, path: ${objectPath}`
            )

            // Download the file using Supabase client with correct path
            const { data, error } = await supabase.storage
              .from(bucketName)
              .download(objectPath)

            if (error) {
              console.error("Supabase download error:", error)
              throw error
            }

            if (!data) {
              throw new Error("No data returned from Supabase")
            }

            console.log(
              "File downloaded successfully, size:",
              data.size,
              "type:",
              data.type
            )

            // Create a proper audio file with correct MIME type
            audioFile = new File([data], "audio.wav", {
              type: "audio/wav", // Explicitly set audio MIME type
            })
          } catch (downloadError) {
            console.error("Error accessing Supabase file:", downloadError)
            throw downloadError
          }
        } else {
          // For local or public URLs, use fetch
          const response = await fetch(source.path)
          const blob = await response.blob()

          console.log("Blob fetched:", blob.type, blob.size)

          audioFile = new File([blob], "audio.wav", {
            type: "audio/wav", // Explicitly set correct MIME type regardless of blob.type
          })
        }

        console.log("Audio file prepared:", audioFile.type, audioFile.size)
      } catch (downloadError) {
        console.error("Error downloading audio file:", downloadError)
        const errorMessage =
          downloadError instanceof Error
            ? downloadError.message
            : "Unknown download error"
        setTranscript(`Error downloading audio: ${errorMessage}`)
        setSummary("Could not process audio due to download error.")
        setIsTranscribing(false) // Make sure to reset the flag
        return
      }

      if (audioFile) {
        // First step: Transcribe the audio
        const transcribedText = await transcribeAudio(audioFile)

        if (transcribedText.startsWith("Transcription failed:")) {
          setTranscript(transcribedText)
          setSummary("Could not generate summary due to transcription failure.")
          setIsTranscribing(false) // Make sure to reset the flag on failure
          return
        }

        setTranscript(transcribedText)

        setSourceCache((prev) => ({
          ...prev,
          [source.id]: {
            ...prev[source.id],
            transcript: transcribedText,
          },
        }))

        try {
          localStorage.setItem(
            `source_transcript_${source.id}`,
            transcribedText
          )
        } catch (error) {
          console.warn("Could not save transcript to localStorage:", error)
        }

        // Second step: Generate summary from transcript
        setSummary("Generating summary from transcript...")
        const summaryText = await summarizeTranscript(transcribedText)
        setSummary(summaryText)

        setSourceCache((prev) => ({
          ...prev,
          [source.id]: {
            ...prev[source.id],
            summary: summaryText,
          },
        }))

        try {
          localStorage.setItem(`source_summary_${source.id}`, summaryText)
        } catch (error) {
          console.warn("Could not save summary to localStorage:", error)
        }

        // Save to Supabase after processing
        if (transcribedText && summaryText) {
          await saveSourceDataToSupabase(source.id, {
            transcript: transcribedText,
            summary: summaryText,
          })
        }
      } else {
        setTranscript("Failed to load audio file for transcription.")
        setSummary("Could not generate summary.")
      }

      const newProcessedSources = new Set(processedSources)
      newProcessedSources.add(source.id)
      setProcessedSources(newProcessedSources)

      try {
        localStorage.setItem(
          "processedSources",
          JSON.stringify([...newProcessedSources])
        )
      } catch (error) {
        console.warn("Could not save processed sources to localStorage:", error)
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      setTranscript(
        `Processing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      setSummary("Could not generate summary due to an error.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleDeleteSource = (sourceId: string) => {
    setSourceToDelete(sourceId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteSource = async () => {
    if (!sourceToDelete) return

    setIsProcessing(true)

    try {
      // Find the source to get its path
      const sourceToDeleteObj = sources.find(
        (source) => source.id === sourceToDelete
      )

      if (sourceToDeleteObj) {
        // Delete from Supabase first
        await deleteSource(sourceToDelete, sourceToDeleteObj.path)

        // Then update local state - remove the source from the sources array
        setSources((prev) =>
          prev.filter((source) => source.id !== sourceToDelete)
        )

        // Clear selected source if the deleted one was selected
        if (selectedSource?.id === sourceToDelete) {
          setSelectedSource(null)
          setTranscript(null)
          setSummary(null)
          setTextContent("")
          setHighlights([])
          setResponse(null)
        }

        // Clean up cache
        setSourceCache((prev) => {
          const newCache = { ...prev }
          delete newCache[sourceToDelete]
          return newCache
        })

        // Clean up localStorage
        try {
          localStorage.removeItem(`source_transcript_${sourceToDelete}`)
          localStorage.removeItem(`source_summary_${sourceToDelete}`)
          localStorage.removeItem(`source_textContent_${sourceToDelete}`)
        } catch (error) {
          console.warn("Error cleaning up localStorage:", error)
        }

        // Reset state and close dialog
        setSourceToDelete(null)
        setShowDeleteDialog(false)
        setIsProcessing(false)

        // Refresh the page after a short delay to allow dialog to close
        setTimeout(() => {
          window.location.reload()
        }, 300)

        return // Exit early since we're refreshing
      }
    } catch (error) {
      console.error("Error deleting source:", error)
      // You could add a toast notification here to show the error
    }

    // Only run these if there was an error or no source found
    setSourceToDelete(null)
    setShowDeleteDialog(false)
    setIsProcessing(false)
  }

  // Handle source selection
  useEffect(() => {
    if (!selectedSource) return

    setHighlights([])

    if (selectedSource.type === "audio") {
      // Audio player is handled by the separate useEffect above

      if (sourceCache[selectedSource.id]) {
        const cachedData = sourceCache[selectedSource.id]

        if (cachedData.transcript) {
          setTranscript(cachedData.transcript)
        } else {
          fetchTranscriptAndSummary(selectedSource)
        }

        if (cachedData.summary) {
          setSummary(cachedData.summary)
        }
      } else {
        fetchTranscriptAndSummary(selectedSource)
      }
    } else if (selectedSource.type === "pdf") {
      // Clear audio player for non-audio sources
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.src = ""
        setAudioPlayer(null)
      }

      setTranscript(null)
      setSummary(null)

      if (sourceCache[selectedSource.id]?.textContent) {
        setTextContent(sourceCache[selectedSource.id].textContent || "")
      } else {
        setTextContent("")
      }
    }
  }, [selectedSource, sourceCache, processedSources])

  // Helper function to render transcript with highlights
  const renderWithHighlights = (text: string | null) => {
    if (!text || !highlights.length) return text

    const sentences = text.split(/(?<=[.!?])\s+/)
    const highlightMap = new Map()

    highlights.forEach((highlight) => {
      highlightMap.set(highlight.index, highlight.score || 0.8)
    })

    return sentences.map((sentence, index) => {
      if (highlightMap.has(index)) {
        const score = highlightMap.get(index)
        const opacity = Math.min(0.3 + score * 0.7, 1).toFixed(2)

        return (
          <mark
            key={index}
            className="px-1 rounded"
            style={{
              backgroundColor: `rgba(250, 204, 21, ${opacity})`,
              textDecoration: "underline",
              textDecorationColor: "rgba(202, 138, 4, 0.6)",
              textDecorationStyle: "dotted",
              textDecorationThickness: "2px",
              textUnderlineOffset: "3px",
            }}
            title={`Relevance score: ${(score * 100).toFixed(0)}%`}
          >
            {sentence}
          </mark>
        )
      }

      return <span key={index}>{sentence} </span>
    })
  }

  const handleQuerySubmit = async () => {
    if (!query.trim() || !selectedSource) return

    setResponse("Processing...")
    setIsProcessing(true)
    setHighlights([])

    try {
      if (language !== "en") {
        setResponse("Queries are only available in English at this time.")
        setIsProcessing(false)
        return
      }

      let context = ""
      if (selectedSource.type === "audio") {
        context = transcript || ""
      } else if (selectedSource.type === "pdf") {
        context = textContent || ""
      }

      if (!context) {
        setResponse("Unable to extract content from the selected source.")
        setIsProcessing(false)
        return
      }

      const llmPromise = fetchLLMResponse(
        `Question: ${query}\n\nContext from ${
          selectedSource.type
        }: ${context.substring(0, 2000)}...`
      )

      let fullResponse = ""
      let apiResponse: QueryResponse

      try {
        apiResponse = await queryBackend(query, context)
        fullResponse = apiResponse.answer

        if (apiResponse.highlights && apiResponse.highlights.length > 0) {
          setHighlights(apiResponse.highlights)
        }

        try {
          const groqHighlights = await getGroqHighlights(query, context)

          if (groqHighlights && groqHighlights.length > 0) {
            const sentences = context.split(/(?<=[.!?])\s+/)
            const groqHighlightObjects = groqHighlights.map((index) => ({
              index: index,
              text:
                index >= 0 && index < sentences.length ? sentences[index] : "",
              score: 0.85,
            }))

            if (apiResponse.highlights && apiResponse.highlights.length > 0) {
              const highlightMap = new Map()
              apiResponse.highlights.forEach((highlight) => {
                highlightMap.set(highlight.index, highlight)
              })

              const combinedHighlights: Highlight[] = [
                ...apiResponse.highlights,
              ]

              groqHighlightObjects.forEach((highlight) => {
                if (!highlightMap.has(highlight.index)) {
                  combinedHighlights.push(highlight)
                }
              })

              setHighlights(combinedHighlights)
            } else {
              setHighlights(groqHighlightObjects)
            }
          }
        } catch (groqError) {
          console.error("Groq API error:", groqError)
        }

        if (
          apiResponse.merged_highlights &&
          apiResponse.merged_highlights.length > 0
        ) {
          const uniqueHighlights = apiResponse.merged_highlights.filter(
            (h) => h.text.trim() !== apiResponse.answer.trim()
          )

          if (uniqueHighlights.length > 0) {
            const highlightTexts = uniqueHighlights.map(
              (h) =>
                `· ${h.text} (confidence: ${Math.min(
                  h.avg_score * 100,
                  99
                ).toFixed(0)}%)`
            )
            fullResponse += `\n\nRelevant passages:\n${highlightTexts.join(
              "\n\n"
            )}`
          }
        }
      } catch (backendError) {
        console.error("Backend API error:", backendError)
        fullResponse = "Error retrieving information from the backend API. "
      }

      try {
        const llmResponse = await llmPromise
        fullResponse += `\n\nChatbot Response:\n${llmResponse}`
      } catch (llmError) {
        console.error("LLM API error:", llmError)
        fullResponse += `\n\nChatbot Response:\nUnable to retrieve response from the language model.`
      }

      setResponse(fullResponse)
    } catch (error) {
      console.error("Query submission error:", error)
      setResponse(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const file = files[0]
    setUploadFile(file)

    if (!uploadTitle) {
      setUploadTitle(file.name.split(".").slice(0, -1).join("."))
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) return

    try {
      const isPdf =
        uploadFile.type === "application/pdf" ||
        uploadFile.name.toLowerCase().endsWith(".pdf")

      // Create a new source object
      const newSource: Source = {
        id: `temp-${Date.now()}`, // Temporary ID until we get the real one from Supabase
        title: uploadTitle,
        type: isPdf ? "pdf" : "audio",
        path: "", // Will be set by Supabase
        file: uploadFile,
        duration: !isPdf ? "00:00" : undefined,
      }

      // Save the source to Supabase
      const savedSource = await saveSource(newSource, uploadFile)

      // Update local state with the saved source
      setSources((prev) => [...prev, savedSource])
      setSelectedSource(savedSource)

      setUploadTitle("")
      setUploadFile(null)
      setIsUploadDialogOpen(false)
    } catch (err) {
      console.error("Error adding source:", err)
    }
  }

  const handleRecordSubmit = async (audioSource: AudioSource) => {
    try {
      console.log("Received new audio source:", audioSource)

      // Create a source from the audio source
      const newSource: Source = {
        ...audioSource,
        id: audioSource.id || `temp-recording-${Date.now()}`,
      }

      if (audioSource.file) {
        // Set loading state
        setIsProcessing(true)

        // First update the sources list immediately to show in sidebar
        setSources((prev) => [...prev, newSource])

        // Then set as selected to show the content
        setSelectedSource(newSource)

        // THEN start saving to Supabase - this can happen in the background
        try {
          const savedSource = await saveSource(newSource, audioSource.file)

          // Update the source in the sources list with the permanent ID from Supabase
          setSources((prev) =>
            prev.map((source) =>
              source.id === newSource.id ? savedSource : source
            )
          )

          // Update the selected source with the permanent one
          if (selectedSource?.id === newSource.id) {
            setSelectedSource(savedSource)
          }

          // Process the audio after saving
          await fetchTranscriptAndSummary(savedSource)
        } catch (saveError) {
          console.error("Error saving to Supabase:", saveError)
          // The recording still appears in the UI, just won't be saved permanently
        }
      }
    } catch (error) {
      console.error("Error handling recording:", error)
      setTranscript(
        `Error processing recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      setSummary("Could not process recording.")
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => {
      sources.forEach((source) => {
        if (source.path.startsWith("blob:")) {
          URL.revokeObjectURL(source.path)
        }
      })
    }
  }, [sources])

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <div className="w-80 border-r p-4">
        <div className="flex flex-col h-full">
          <h2 className="text-lg mb-4">Sources</h2>
          <div className="flex flex-col gap-2 mb-4">
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {language === "en" ? "Upload File" : "Subir Archivo"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {language === "en" ? "Upload File" : "Subir Archivo"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "en"
                      ? "Upload an audio file or PDF document"
                      : "Sube un archivo de audio o un documento PDF"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {language === "en" ? "Title" : "Título"}
                    </Label>
                    <Input
                      id="title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder={
                        language === "en" ? "Enter title" : "Ingrese título"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">
                      {language === "en" ? "File" : "Archivo"}
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept="audio/*,application/pdf,.pdf"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {uploadFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm">
                          {uploadFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleUploadSubmit}
                    disabled={!uploadTitle || !uploadFile}
                  >
                    {language === "en" ? "Upload" : "Subir"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <RecordSourceDialog onAddSource={handleRecordSubmit} />
          </div>

          <div className="space-y-2">
            {isLoadingSources ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">Loading your sources...</p>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">
                  No sources found. Upload or record to get started.
                </p>
              </div>
            ) : (
              sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer ${
                    selectedSource?.id === source.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedSource(source)}
                >
                  {source.type === "audio" ? (
                    <Mic className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <div className="flex-1">
                    <div>{source.title}</div>
                    {source.duration && (
                      <div className="text-xs text-muted-foreground">
                        {source.duration}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSource(source.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl">Audio Notebook</h1>
            {selectedSource && (
              <span className="text-sm text-muted-foreground">
                {selectedSource.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share className="h-5 w-5" />
            </Button>
            <SettingsDialog />
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {selectedSource ? (
              <Card className="p-6">
                {selectedSource.type === "audio" && (
                  <>
                    <h3 className="font-semibold mb-4">Audio Playback</h3>
                    {audioLoadingStatus === "loading" && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-blue-700">Loading audio...</p>
                      </div>
                    )}
                    {audioLoadingError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-700 font-medium">
                          Audio Loading Error:
                        </p>
                        <p className="text-red-600 text-sm">
                          {audioLoadingError}
                        </p>
                        <p className="text-red-600 text-sm mt-1">
                          Try refreshing the page or check the browser console
                          for more details.
                        </p>
                      </div>
                    )}
                    {audioPlayer && audioSrc ? (
                      <audio
                        key={audioSrc} // Force re-render when source changes
                        controls
                        src={audioSrc}
                        className="w-full"
                        onError={(e) => {
                          console.error("HTML audio element error:", e)
                          setAudioLoadingError(
                            "Audio playback failed in the browser"
                          )
                          setAudioLoadingStatus("error")
                        }}
                        onLoadStart={() => {
                          console.log("HTML audio element started loading")
                        }}
                        onCanPlay={() => {
                          console.log("HTML audio element can play")
                        }}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Select an audio source to play.
                      </p>
                    )}

                    <h3 className="font-semibold mt-6 mb-4">Summary</h3>
                    <div className="flex-1">
                      {isTranscribing ? (
                        <div className="text-center p-4">
                          <div className="animate-pulse mb-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                          </div>
                          <p>Generating summary... This may take a moment.</p>
                        </div>
                      ) : (
                        <>
                          {summary ? (
                            <div className="whitespace-pre-wrap">{summary}</div>
                          ) : (
                            <div className="italic">
                              {language === "en"
                                ? "No summary available."
                                : "No hay resumen disponible."}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                <h3 className="font-semibold mt-6 mb-4">
                  {selectedSource.type === "audio"
                    ? "Ask about this Audio"
                    : "Ask about this Document"}
                </h3>
                <div className="relative">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      language === "en"
                        ? "Ask a question..."
                        : "Hacer una pregunta..."
                    }
                    className="pr-24"
                    onKeyPress={(e) => e.key === "Enter" && handleQuerySubmit()}
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleQuerySubmit}
                    disabled={isProcessing || !query.trim()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {response && (
                  <div className="mt-4 p-4 border rounded bg-muted whitespace-pre-line">
                    <p className="font-semibold">Response:</p>
                    <p>{response}</p>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center text-muted-foreground">
                {language === "en"
                  ? "Select a source to view summary and content"
                  : "Seleccione una fuente para ver el resumen y el contenido"}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar */}
      <div className="w-96 border-l p-4">
        <div className="flex flex-col h-full">
          <h2 className="text-lg mb-4">
            {language === "en" ? "Transcript" : "Transcripción"}
          </h2>
          <div className="flex-1">
            {selectedSource ? (
              <>
                {selectedSource.type === "audio" ? (
                  <ScrollArea className="h-full">
                    <div className="space-y-4 whitespace-pre-wrap text-muted-foreground">
                      {isTranscribing ? (
                        <div className="text-center p-4">
                          <div className="animate-pulse mb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                          </div>
                          <p>
                            Generating transcript... This may take several
                            minutes depending on the audio length.
                          </p>
                        </div>
                      ) : (
                        renderWithHighlights(
                          transcript || "Waiting for transcript..."
                        )
                      )}
                    </div>
                  </ScrollArea>
                ) : selectedSource.type === "pdf" ? (
                  <div className="h-full">
                    <CustomPDFViewer
                      file={selectedSource.path}
                      onTextContentChange={setPDFTextContent}
                    />
                  </div>
                ) : selectedSource.type === "transcript" ? (
                  <ScrollArea className="h-full">
                    <div className="space-y-4 whitespace-pre-wrap text-muted-foreground">
                      {renderWithHighlights(
                        transcript || "Waiting for transcript..."
                      )}
                    </div>
                  </ScrollArea>
                ) : null}
              </>
            ) : (
              <div className="text-muted-foreground">
                {language === "en"
                  ? "No source selected"
                  : "Ninguna fuente seleccionada"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The source will be permanently
              deleted from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSource}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Notebook
