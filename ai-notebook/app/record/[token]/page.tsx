// app/record/[token]/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { validateLink, incrementLinkUsage } from "@/lib/linkStorage";
import { supabase } from "@/lib/supabaseClient";

interface PageProps {
  params: {
    token: string;
  };
}

interface LinkData {
  id: string;
  userId: string;
  title: string;
  description: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

export default function RecordPage({ params }: PageProps): JSX.Element {
  const { token } = params;
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format recording time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Validate the link on page load
  useEffect(() => {
    // Check if localStorage is available (we're in the browser)
    if (typeof window === 'undefined') return;
    
    const validateRecordingLink = () => {
      try {
        const validation = validateLink(token);
        
        if (!validation.valid) {
          setError(validation.reason || "Invalid link");
          setLinkData(null);
        } else {
          setLinkData(validation.link || null);
          setError(null);
        }
      } catch (err) {
        console.error("Error validating link:", err);
        setError("There was a problem validating this recording link.");
        setLinkData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateRecordingLink();
    
    // Cleanup function
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token]);
  
  // Handle recording start/stop
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      const audioChunks: BlobPart[] = [];
      
      recorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });
      
      recorder.addEventListener("stop", () => {
        // Create blob and URL
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions and try again.");
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkData || !audioBlob || isSubmitting || !studentName) return;
    
    try {
      setIsSubmitting(true);
      
      // Generate file name
      const sanitizedName = studentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `recordings/${linkData.userId}/${token}/${Date.now()}_${sanitizedName}.webm`;
      
      console.log("Uploading file to storage...");
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(fileName, audioBlob);
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      console.log("File uploaded successfully, getting public URL...");
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('audio_files')
        .getPublicUrl(fileName);
        
      if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to get public URL");
      }
      
      console.log("Public URL obtained:", publicUrlData.publicUrl);
      
      // Calculate duration
      const duration = formatTime(recordingTime);
      
      console.log("Creating audio_source entry...");
      
      // Create a new entry in audio_sources table instead of sources
      const { data: audioSourceData, error: audioSourceError } = await supabase
        .from('audio_sources')
        .insert({
          title: `Recording from ${studentName}`,
          type: 'audio',
          file_path: publicUrlData.publicUrl,
          duration: duration,
          user_id: linkData.userId // This links to auth.users.id
        })
        .select();
      
      if (audioSourceError) {
        console.error("Audio source insert error:", audioSourceError);
        throw audioSourceError;
      }
      
      console.log("Audio source created successfully:", audioSourceData);
      
      // Increment the link usage
      incrementLinkUsage(token);
      
      setIsSuccess(true);
    } catch (err) {
      console.error("Error submitting recording:", err);
      setError(`Failed to submit recording: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="text-destructive text-xl font-semibold">Error</div>
          <p>{error}</p>
        </Card>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="text-2xl font-semibold text-primary">Recording Submitted!</div>
          <p>Your recording has been successfully submitted. Thank you!</p>
          <p className="text-sm text-muted-foreground mt-4">You can now close this page.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {linkData && (
        <Card className="max-w-md w-full p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">{linkData.title}</h1>
            {linkData.description && (
              <p className="mt-2 text-muted-foreground">{linkData.description}</p>
            )}
          </div>
          
          <div className="flex justify-center flex-col items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full h-16 w-16"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            
            {isRecording && (
              <div className="text-center mt-2">
                <div className="animate-pulse text-sm text-primary">Recording... {formatTime(recordingTime)}</div>
              </div>
            )}
          </div>
          
          {audioURL && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Review your recording</h3>
                <audio className="w-full" controls src={audioURL} />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !studentName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Recording
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}