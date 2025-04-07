"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Mic, Share, ChevronRight, Upload, Trash2 } from "lucide-react";
import { SettingsDialog } from "../components/settings-dialog";
import { useLanguage } from "../contexts/language-context";
import type { AudioSource } from "../types/audio";
import { fetchLLMResponse } from "@/lib/groqApi";
import { RecordSourceDialog } from "@/components/record-source-dialog";
import { transcribeAudio } from "@/lib/transcribe";
import { summarizeTranscript } from "@/lib/summarize";
import CustomPDFViewer from "@/components/CustomPDFViewer";
import { getGroqHighlights, combineHighlights } from "@/lib/groqHighlightUtils";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const API_URL = process.env.NEXT_PUBLIC_BACKENDURL;

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
        max_highlight_sentences: 3,
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

interface Source {
  id: string;
  title: string;
  type: "audio" | "pdf";
  duration?: string;
  path: string;
  file?: File;
}

const INITIAL_SOURCES: Source[] = [];

interface SourceCache {
  [sourceId: string]: {
    transcript?: string;
    summary?: string;
    textContent?: string;
  }
}

const Notebook = () => {
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

  const setPDFTextContent = (content: string) => {
    if (!selectedSource) return;
    
    setTextContent(content);
    
    setSourceCache(prev => ({
      ...prev,
      [selectedSource.id]: {
        ...prev[selectedSource.id],
        textContent: content
      }
    }));
    
    try {
      localStorage.setItem(`source_textContent_${selectedSource.id}`, content);
    } catch (error) {
      console.warn('Could not save PDF text content to localStorage:', error);
    }
  };

  useEffect(() => {
    try {
      const savedProcessedSources = localStorage.getItem('processedSources');
      if (savedProcessedSources) {
        setProcessedSources(new Set(JSON.parse(savedProcessedSources)));
      }
      
      const tempCache: SourceCache = {};
      
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

  const fetchTranscriptAndSummary = async (source: Source) => {
    if (source.type !== "audio") return;
    
    if (processedSources.has(source.id)) {
      if (sourceCache[source.id]?.transcript) {
        setTranscript(sourceCache[source.id].transcript || null);
      } else {
        setTranscript("Transcript unavailable.");
      }
      
      if (sourceCache[source.id]?.summary) {
        setSummary(sourceCache[source.id].summary || null);
      } else {
        setSummary("Summary unavailable.");
      }
      return;
    }
    
    setTranscript("Fetching transcript...");
    setSummary("Generating summary...");

    try {
      let audioFile: File | null = null;
      const response = await fetch(source.path);
      const blob = await response.blob();
      audioFile = new File([blob], "audio.wav", { type: blob.type || "audio/wav" });
      
      if (audioFile) {
        const transcribedText = await transcribeAudio(audioFile);
        setTranscript(transcribedText);
        
        setSourceCache(prev => ({
          ...prev,
          [source.id]: {
            ...prev[source.id],
            transcript: transcribedText
          }
        }));
        
        try {
          localStorage.setItem(`source_transcript_${source.id}`, transcribedText);
        } catch (error) {
          console.warn('Could not save transcript to localStorage:', error);
        }

        const summaryText = await summarizeTranscript(transcribedText);
        setSummary(summaryText);
        
        setSourceCache(prev => ({
          ...prev,
          [source.id]: {
            ...prev[source.id],
            summary: summaryText
          }
        }));
        
        try {
          localStorage.setItem(`source_summary_${source.id}`, summaryText);
        } catch (error) {
          console.warn('Could not save summary to localStorage:', error);
        }
      } else {
        setTranscript("Failed to load audio file for transcription.");
        setSummary("Could not generate summary.");
      }
      
      const newProcessedSources = new Set(processedSources);
      newProcessedSources.add(source.id);
      setProcessedSources(newProcessedSources);
      
      try {
        localStorage.setItem('processedSources', JSON.stringify([...newProcessedSources]));
      } catch (error) {
        console.warn('Could not save processed sources to localStorage:', error);
      }
    } catch (error) {
      setTranscript("Error transcribing audio.");
      setSummary("Error generating summary.");
      console.error(error);
    }
  };
  
  const handleDeleteSource = (sourceId: string) => {
    setSourceToDelete(sourceId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSource = () => {
    if (!sourceToDelete) return;

    setSources(prev => prev.filter(source => source.id !== sourceToDelete));
    
    // Clean up if the deleted source was selected
    if (selectedSource?.id === sourceToDelete) {
      setSelectedSource(null);
      setTranscript(null);
      setSummary(null);
      setTextContent("");
    }

    // Clean up cache
    setSourceCache(prev => {
      const newCache = {...prev};
      delete newCache[sourceToDelete];
      return newCache;
    });

    // Clean up localStorage
    try {
      localStorage.removeItem(`source_transcript_${sourceToDelete}`);
      localStorage.removeItem(`source_summary_${sourceToDelete}`);
      localStorage.removeItem(`source_textContent_${sourceToDelete}`);
    } catch (error) {
      console.warn('Error cleaning up localStorage:', error);
    }

    setSourceToDelete(null);
    setShowDeleteDialog(false);
  };

  useEffect(() => {
    if (!selectedSource) return;
    
    setHighlights([]);
    
    if (selectedSource.type === "audio") {
      setAudioPlayer(new Audio(selectedSource.path));
      
      if (sourceCache[selectedSource.id]) {
        const cachedData = sourceCache[selectedSource.id];
        
        if (cachedData.transcript) {
          setTranscript(cachedData.transcript);
        } else {
          fetchTranscriptAndSummary(selectedSource);
        }
        
        if (cachedData.summary) {
          setSummary(cachedData.summary);
        }
      } else {
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
  }, [selectedSource, sourceCache, processedSources]);

  const renderWithHighlights = (text: string | null) => {
    if (!text || !highlights.length) return text;
    
    const sentences = text.split(/(?<=[.!?])\s+/);
    const highlightMap = new Map();
    
    highlights.forEach(highlight => {
      highlightMap.set(highlight.index, highlight.score || 0.8);
    });
    
    return sentences.map((sentence, index) => {
      if (highlightMap.has(index)) {
        const score = highlightMap.get(index);
        const opacity = Math.min(0.3 + score * 0.7, 1).toFixed(2);
        
        return (
          <mark 
            key={index} 
            className="px-1 rounded" 
            style={{ 
              backgroundColor: `rgba(250, 204, 21, ${opacity})`,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(202, 138, 4, 0.6)',
              textDecorationStyle: 'dotted',
              textDecorationThickness: '2px',
              textUnderlineOffset: '3px'
            }}
            title={`Relevance score: ${(score * 100).toFixed(0)}%`}
          >
            {sentence} 
          </mark>
        );
      }
      
      return <span key={index}>{sentence} </span>;
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
      
      try {
        const apiResponse = await queryBackend(query, context);
        fullResponse = apiResponse.answer;
        
        if (apiResponse.highlights && apiResponse.highlights.length > 0) {
          setHighlights(apiResponse.highlights);
        }
        
        try {
          const groqHighlights = await getGroqHighlights(query, context);
          
          if (groqHighlights && groqHighlights.length > 0) {
            const sentences = context.split(/(?<=[.!?])\s+/);
            const groqHighlightObjects = groqHighlights.map(index => ({
              index: index,
              text: index >= 0 && index < sentences.length ? sentences[index] : "",
              score: 0.85
            }));
            
            if (apiResponse.highlights && apiResponse.highlights.length > 0) {
              const highlightMap = new Map();
              apiResponse.highlights.forEach(highlight => {
                highlightMap.set(highlight.index, highlight);
              });
              
              const combinedHighlights: Highlight[] = [...apiResponse.highlights];
              
              groqHighlightObjects.forEach(highlight => {
                if (!highlightMap.has(highlight.index)) {
                  combinedHighlights.push(highlight);
                }
              });
              
              setHighlights(combinedHighlights);
            } else {
              setHighlights(groqHighlightObjects);
            }
          }
        } catch (groqError) {
          console.error('Groq API error:', groqError);
        }
        
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

  const handleUploadSubmit = () => {
    if (!uploadFile || !uploadTitle.trim()) return;

    try {
      const url = URL.createObjectURL(uploadFile);
      const isPdf = uploadFile.type === 'application/pdf' || 
                   uploadFile.name.toLowerCase().endsWith('.pdf');
      
      const newSource: Source = {
        id: `uploaded-${Date.now()}`,
        title: uploadTitle,
        type: isPdf ? 'pdf' : 'audio',
        path: url,
        file: uploadFile,
        duration: !isPdf ? '00:00' : undefined
      };

      setSources(prev => [...prev, newSource]);
      setSelectedSource(newSource);
      
      setUploadTitle("");
      setUploadFile(null);
      setIsUploadDialogOpen(false);
    } catch (err) {
      console.error("Error adding source:", err);
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
          <h2 className="text-lg mb-4">Sources</h2>
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
            
            <RecordSourceDialog onAddSource={(newSource) => {
              setSources(prev => [...prev, newSource]);
              setSelectedSource(newSource);
            }} />
          </div>
            
          <div className="space-y-2">
            {sources.map((source) => (
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
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSource(source.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                {selectedSource.type === "audio" && (
                  <>
                    <h3 className="font-semibold mb-4">Audio Playback</h3>
                    {audioPlayer ? (
                      <audio controls src={selectedSource.path} className="w-full" />
                    ) : (
                      <p className="text-muted-foreground">Select an audio source to play.</p>
                    )}

                    <h3 className="font-semibold mt-6 mb-4">Summary</h3>
                    <p className="text-muted-foreground">
                      {summary || "Generating summary..."}
                    </p>
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
                      {renderWithHighlights(transcript || "Fetching transcript...")}
                    </div>
                  </ScrollArea>
                ) : selectedSource.type === "pdf" ? (
                  <div className="h-full">
                    <CustomPDFViewer 
                      file={selectedSource.path} 
                      onTextContentChange={setPDFTextContent} 
                    />
                  </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSource}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notebook;