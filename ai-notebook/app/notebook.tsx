"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Mic, Share, ChevronRight, Upload, RefreshCw, Loader2 } from "lucide-react";
import { SettingsDialog } from "../components/settings-dialog";
import { useLanguage } from "../contexts/language-context";
import type { AudioSource } from "../types/audio";
import { fetchLLMResponse } from "@/lib/groqApi";
import { RecordSourceDialog } from "@/components/record-source-dialog";
import { transcribeAudio } from "@/lib/transcribe";
import { summarizeTranscript } from "@/lib/summarize";
import CustomPDFViewer from "@/components/CustomPDFViewer";
import { saveSource, saveSourceData, getSourceData } from "@/lib/supabaseClient";
import { CreateLinkButton } from "@/components/create-link-button";
import { cleanupExpiredLinks } from "@/lib/linkStorage";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Define interfaces for API response
interface Highlight {
  index: number;
  text: string;
  score: number;
}

interface MergedHighlight {
  start_index: number;
  end_index: number;
  text: string;
  avg_score: number;
}

interface QueryResponse {
  answer: string;
  confidence: number;
  highlights: Highlight[];
  merged_highlights: MergedHighlight[];
}

// API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_BACKENDURL;

// Helper function to query the backend API
async function queryBackend(question: string, context: string): Promise<QueryResponse> {
  try {
    const response = await fetch(`${API_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
        threshold: 0.7,
        max_highlight_sentences: 3, // Allow up to 3 sentences to be highlighted
        chunk_size: 4,
        chunk_overlap: 2
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error querying backend:', error);
    throw error;
  }
}

// Update the local Source interface
interface Source {
  id: string;
  title: string;
  type: "audio" | "pdf" | "transcript";
  duration?: string;
  path: string;
  file?: File;
}

const INITIAL_SOURCES: Source[] = [];

// Interface to store cached data for each source
interface SourceCache {
  [sourceId: string]: {
    transcript?: string;
    summary?: string;
    textContent?: string;
  }
}

interface NotebookProps {
  initialSources?: Source[];
  isLoadingSources?: boolean;
  onRefreshSources?: () => Promise<void>;
}

const Notebook = ({ initialSources = INITIAL_SOURCES, isLoadingSources = false, onRefreshSources }: NotebookProps) => {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { language } = useLanguage();
  const [textContent, setTextContent] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSources, setProcessedSources] = useState<Set<string>>(new Set());
  const [sourceCache, setSourceCache] = useState<SourceCache>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh sources and clean up expired links
  const refreshSources = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Clean up expired links from localStorage
      cleanupExpiredLinks();
      
      // If parent component provided a refresh function, call it
      if (onRefreshSources) {
        await onRefreshSources();
      }
    } catch (error) {
      console.error("Error refreshing sources:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshSources]);

  // Auto-refresh sources every minute to check for new submissions
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if we're not already loading
      if (!isLoadingSources && !isRefreshing) {
        refreshSources();
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [isLoadingSources, isRefreshing, refreshSources]);

  // Update sources when initialSources change (user's sources from database)
  useEffect(() => {
    if (initialSources && initialSources.length > 0) {
      setSources(initialSources);
      // Select the first source if none is selected
      if (!selectedSource && initialSources.length > 0) {
        setSelectedSource(initialSources[0]);
      }
    }
  }, [initialSources, selectedSource]);

  // Add a function to get text content from PDF viewer and cache it
  const setPDFTextContent = (content: string) => {
    if (!selectedSource) return;
    
    setTextContent(content);
    
    // Update cache with the new text content
    setSourceCache(prev => ({
      ...prev,
      [selectedSource.id]: {
        ...prev[selectedSource.id],
        textContent: content
      }
    }));
    
    // Save to localStorage
    try {
      localStorage.setItem(`source_textContent_${selectedSource.id}`, content);
    } catch (error) {
      console.warn('Could not save PDF text content to localStorage:', error);
    }
  };

  // Load cache from localStorage on component mount
  useEffect(() => {
    try {
      // Load processed sources from localStorage
      const savedProcessedSources = localStorage.getItem('processedSources');
      if (savedProcessedSources) {
        setProcessedSources(new Set(JSON.parse(savedProcessedSources)));
      }
      
      // Load source cache data
      const tempCache: SourceCache = {};
      
      // Scan all localStorage items for our cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.startsWith('source_transcript_')) {
          const sourceId = key.replace('source_transcript_', '');
          tempCache[sourceId] = tempCache[sourceId] || {};
          tempCache[sourceId].transcript = localStorage.getItem(key) || undefined;
        } else if (key.startsWith('source_summary_')) {
          const sourceId = key.replace('source_summary_', '');
          tempCache[sourceId] = tempCache[sourceId] || {};
          tempCache[sourceId].summary = localStorage.getItem(key) || undefined;
        } else if (key.startsWith('source_textContent_')) {
          const sourceId = key.replace('source_textContent_', '');
          tempCache[sourceId] = tempCache[sourceId] || {};
          tempCache[sourceId].textContent = localStorage.getItem(key) || undefined;
        }
      }
      
      setSourceCache(tempCache);
    } catch (error) {
      console.warn('Error loading cache from localStorage:', error);
    }
  }, []);

  // Function to save source data to Supabase
  const saveSourceDataToSupabase = async (sourceId: string, data: { 
    transcript?: string; 
    summary?: string; 
    textContent?: string; 
  }) => {
    try {
      await saveSourceData(sourceId, data);
    } catch (error) {
      console.error("Error saving source data to Supabase:", error);
    }
  };
  
  // When transcription and summary are generated, save them to Supabase
  useEffect(() => {
    if (selectedSource && transcript && summary) {
      saveSourceDataToSupabase(selectedSource.id, {
        transcript,
        summary
      });
    }
  }, [selectedSource, transcript, summary]);
  
  // When PDF text content is processed, save it to Supabase
  useEffect(() => {
    if (selectedSource?.type === 'pdf' && textContent && textContent.length > 0) {
      saveSourceDataToSupabase(selectedSource.id, {
        textContent
      });
    }
  }, [selectedSource, textContent]);

  const loadSourceData = async (source: Source) => {
    try {
      // First, try to load from source_data (for regular sources)
      try {
        const data = await getSourceData(source.id);
        
        if (data) {
          if (data.transcript) {
            setTranscript(data.transcript);
            
            setSourceCache(prev => ({
              ...prev,
              [source.id]: {
                ...prev[source.id],
                transcript: data.transcript
              }
            }));
          }
          
          if (data.summary) {
            setSummary(data.summary);
            
            setSourceCache(prev => ({
              ...prev,
              [source.id]: {
                ...prev[source.id],
                summary: data.summary
              }
            }));
          }
          
          if (data.text_content) {
            setTextContent(data.text_content);
            
            setSourceCache(prev => ({
              ...prev,
              [source.id]: {
                ...prev[source.id],
                textContent: data.text_content
              }
            }));
          }
          
          return; // If we found data, we're done
        }
      } catch (sourceDataError) {
        console.log("No data found in source_data, checking audio_sources...");
        // This is expected for audio_sources, so don't treat as an error
      }
      
      // If we didn't find data in source_data, check if it might be from audio_sources
      try {
        const { data: audioSourceData, error: audioSourceError } = await supabase
          .from('audio_sources')
          .select('*')
          .eq('id', source.id)
          .single();
          
        if (audioSourceError) {
          console.log("Source not found in audio_sources either");
          return;
        }
        
        if (audioSourceData) {
          console.log("Found source in audio_sources:", audioSourceData);
          
          // For audio_sources, we might not have transcript/summary yet
          // But we can still show the audio player
          setTranscript("Audio from student submission - click process to generate transcript");
          setSummary("Processing required to generate summary");
          
          // Stop loading indicator and allow normal interaction
          setIsTranscribing(false);
        }
      } catch (audioSourceError) {
        console.error("Error checking audio_sources:", audioSourceError);
        // Continue without failing - we'll just show empty transcript/summary
        setIsTranscribing(false);
      }
    } catch (error) {
      console.error("Error loading source data:", error);
      // Make sure we're not stuck in loading state
      setIsTranscribing(false);
    }
  };

  // Modify the existing fetchTranscriptAndSummary function
  const fetchTranscriptAndSummary = async (source: Source) => {
    if (source.type !== "audio") return;
    
    // Set loading state at the beginning
    setIsTranscribing(true);
    
    // First try to load from database 
    try {
      await loadSourceData(source);
      
      // If we have data in the cache, use it
      if (sourceCache[source.id]?.transcript) {
        setTranscript(sourceCache[source.id].transcript || null);
        if (sourceCache[source.id]?.summary) {
          setSummary(sourceCache[source.id].summary || null);
        }
        setIsTranscribing(false); // Stop loading state
        return;
      }
      
      // If we get here, we're either transcribing or showing a message
      setTranscript("Generating transcript... This may take a few minutes.");
      setSummary("Waiting for transcript to complete...");
  
      // Rest of your function...
      
    } catch (error) {
      console.error("Error processing audio:", error);
      setTranscript(`Processing error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSummary("Could not generate summary due to an error.");
      setIsTranscribing(false); // Make sure to stop loading state on error
    }
  };
  
  // Handle source selection
  useEffect(() => {
    if (!selectedSource) return;
    
    setHighlights([]);
    setIsTranscribing(false); // Reset state before starting
    
    if (selectedSource.type === "audio") {
      // First set up the audio player regardless of source
      setAudioPlayer(new Audio(selectedSource.path));
      
      // Check cache
      if (sourceCache[selectedSource.id]?.transcript) {
        setTranscript(sourceCache[selectedSource.id].transcript || null);
        if (sourceCache[selectedSource.id]?.summary) {
          setSummary(sourceCache[selectedSource.id].summary || null);
        }
      } else {
        // Start loading process with proper state management
        fetchTranscriptAndSummary(selectedSource);
      }
    } else if (selectedSource.type === "pdf") {
      setAudioPlayer(null);
      setTranscript(null);
      setSummary(null);
      
      if (sourceCache[selectedSource.id]?.textContent) {
        setTextContent(sourceCache[selectedSource.id].textContent || "");
      } else {
        setTextContent("");
      }
    }
  }, [selectedSource, sourceCache]);

  // Helper function to render transcript with highlights
  const renderWithHighlights = (text: string | null) => {
    if (!text || !highlights.length) return text;
    
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.map((sentence, index) => {
      const isHighlighted = highlights.some(h => h.index === index);
      return isHighlighted ? (
        <mark key={index} className="bg-yellow-100 px-1 rounded">
          {sentence}
        </mark>
      ) : (
        <span key={index}>{sentence} </span>
      );
    });
  };

  const handleQuerySubmit = async () => {
    if (!query.trim() || !selectedSource) return;
    
    setResponse("Processing...");
    setIsProcessing(true);
    setHighlights([]);
    
    try {
      if (language !== "en") {
        setResponse("Queries are only available in English at this time.");
        setIsProcessing(false);
        return;
      }
      
      let context = "";
      if (selectedSource.type === "audio") {
        context = transcript || "";
      } else if (selectedSource.type === "pdf") {
        context = textContent || "";
      }
      
      if (!context) {
        setResponse("Unable to extract content from the selected source.");
        setIsProcessing(false);
        return;
      }
      
      const llmPromise = fetchLLMResponse(`Question: ${query}\n\nContext from ${selectedSource.type}: ${context.substring(0, 2000)}...`);
      
      let fullResponse = "";
      let apiResponse: QueryResponse = await queryBackend(query, context);
      
      try {
        fullResponse = apiResponse.answer;
        
        if (apiResponse.highlights && apiResponse.highlights.length > 0) {
          setHighlights(apiResponse.highlights);
          
          if (apiResponse.merged_highlights && apiResponse.merged_highlights.length > 0) {
            const uniqueHighlights = apiResponse.merged_highlights.filter(h => 
              h.text.trim() !== apiResponse.answer.trim()
            );
            
            if (uniqueHighlights.length > 0) {
              const highlightTexts = uniqueHighlights.map(h => 
                `· ${h.text} (confidence: ${Math.min((h.avg_score * 100), 99).toFixed(0)}%)`
              );
              fullResponse += `\n\nRelevant passages:\n${highlightTexts.join('\n\n')}`;
            }
          }
        }
      } catch (backendError) {
        console.error('Backend API error:', backendError);
        fullResponse = "Error retrieving information from the backend API. ";
      }
      
      try {
        const llmResponse = await llmPromise;
        fullResponse += `\n\nChatbot Response:\n${llmResponse}`;
      } catch (llmError) {
        console.error('LLM API error:', llmError);
        fullResponse += `\n\nChatbot Response:\nUnable to retrieve response from the language model.`;
      }
      
      setResponse(fullResponse);
    } catch (error) {
      console.error('Query submission error:', error);
      setResponse(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    setUploadFile(file);
    
    if (!uploadTitle) {
      setUploadTitle(file.name.split('.').slice(0, -1).join('.'));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;

    try {
      const isPdf = uploadFile.type === 'application/pdf' || 
                   uploadFile.name.toLowerCase().endsWith('.pdf');
      
      // Create a new source object
      const newSource: Source = {
        id: `temp-${Date.now()}`, // Temporary ID until we get the real one from Supabase
        title: uploadTitle,
        type: isPdf ? 'pdf' : 'audio',
        path: "", // Will be set by Supabase
        file: uploadFile,
        duration: !isPdf ? '00:00' : undefined
      };

      // Save the source to Supabase
      const savedSource = await saveSource(newSource, uploadFile);
      
      // Update local state with the saved source
      setSources(prev => [...prev, savedSource]);
      setSelectedSource(savedSource);
      
      setUploadTitle("");
      setUploadFile(null);
      setIsUploadDialogOpen(false);
    } catch (err) {
      console.error("Error adding source:", err);
    }
  };

  const handleRecordSubmit = async (audioSource: AudioSource) => {
    try {
      console.log("Received new audio source:", audioSource);
      
      // Create a source from the audio source
      const newSource: Source = {
        ...audioSource,
        id: audioSource.id || `temp-recording-${Date.now()}`, 
      };
      
      if (audioSource.file) {
        // Set loading state
        setIsProcessing(true);
        
        // First update the sources list immediately to show in sidebar
        setSources(prev => [...prev, newSource]);
        
        // Then set as selected to show the content
        setSelectedSource(newSource);
        
        // THEN start saving to Supabase - this can happen in the background
        try {
          const savedSource = await saveSource(newSource, audioSource.file);
          
          // Update the source in the sources list with the permanent ID from Supabase
          setSources(prev => prev.map(source => 
            source.id === newSource.id ? savedSource : source
          ));
          
          // Update the selected source with the permanent one
          if (selectedSource?.id === newSource.id) {
            setSelectedSource(savedSource);
          }
          
          // Process the audio after saving
          await fetchTranscriptAndSummary(savedSource);
        } catch (saveError) {
          console.error("Error saving to Supabase:", saveError);
          // The recording still appears in the UI, just won't be saved permanently
        }
      }
    } catch (error) {
      console.error("Error handling recording:", error);
      setTranscript(`Error processing recording: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSummary("Could not process recording.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      sources.forEach(source => {
        if (source.path.startsWith('blob:')) {
          URL.revokeObjectURL(source.path);
        }
      });
    };
  }, [sources]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      
      {/* Left Sidebar */}
      <div className="w-80 border-r p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">Sources</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshSources}
              disabled={isRefreshing || isLoadingSources}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {language === "en" ? "Refresh" : "Actualizar"}
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
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
                      placeholder={language === "en" ? "Enter title" : "Ingrese título"}
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
                        <div className="font-medium text-sm">{uploadFile.name}</div>
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
            
            {/* Create Link Button */}
            <CreateLinkButton />
          </div>
            
          <div className="space-y-2">
            {isLoadingSources || isRefreshing ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">
                  {isRefreshing ? "Refreshing sources..." : "Loading your sources..."}
                </p>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">No sources found. Upload or record to get started.</p>
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
                    {source.duration && <div className="text-xs text-muted-foreground">{source.duration}</div>}
                    {source.title.includes("Recording from") && 
                      <div className="text-xs text-blue-500">Student Submission</div>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Audio & Summary */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl">Audio Notebook</h1>
            {selectedSource && <span className="text-sm text-muted-foreground">{selectedSource.title}</span>}
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
                {/* Audio Player (Only show for audio sources) */}
                {selectedSource.type === "audio" && (
                  <>
                    <h3 className="font-semibold mb-4">Audio Playback</h3>
                    {audioPlayer ? (
                      <audio controls src={selectedSource.path} className="w-full" />
                    ) : (
                      <p className="text-muted-foreground">Select an audio source to play.</p>
                    )}

                    {/* Summary Section */}
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
                              {language === "en" ? "No summary available." : "No hay resumen disponible."}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Query Section */}
                <h3 className="font-semibold mt-6 mb-4">
                  {selectedSource.type === "audio" 
                    ? "Ask about this Audio" 
                    : "Ask about this Document"}
                </h3>
                <div className="relative">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={language === "en" ? "Ask a question..." : "Hacer una pregunta..."}
                    className="pr-24"
                    onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
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

                {/* Display Response */}
                {response && (
                  <div className="mt-4 p-4 border rounded bg-gray-100 whitespace-pre-line">
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

      {/* Right Sidebar - Transcript or PDF Viewer */}
      <div className="w-96 border-l p-4">
        <div className="flex flex-col h-full">
          <h2 className="text-lg mb-4">
            {language === "en" ? "Transcript" : "Transcripción"}
          </h2>
        {selectedSource?.type === "audio" && 
          selectedSource.title.includes("Recording from") && (
          <div className="mb-4">
            <Button
              onClick={() => {
                // Force reprocessing
                setIsTranscribing(true);
                setTranscript("Generating transcript... This may take a few minutes.");
                setSummary("Waiting for transcript to complete...");
                
                // Reset cache for this source
                setSourceCache(prev => ({
                  ...prev,
                  [selectedSource.id]: {}
                }));
                
                // Now process it fresh
                fetchTranscriptAndSummary(selectedSource);
              }}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Process Recording
            </Button>
          </div>
        )}
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
                          <p>Generating transcript... This may take several minutes depending on the audio length.</p>
                        </div>
                      ) : renderWithHighlights(transcript || "Waiting for transcript...")}
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
                      {renderWithHighlights(transcript || "Waiting for transcript...")}
                    </div>
                  </ScrollArea>
                ) : null}
              </>
            ) : (
              <div className="text-muted-foreground">
                {language === "en" ? "No source selected" : "Ninguna fuente seleccionada"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notebook;