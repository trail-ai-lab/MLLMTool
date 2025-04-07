"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Mic, StopCircle } from "lucide-react";
import type { AudioSource } from "../types/audio";
import { Input } from "@/components/ui/input";

export function RecordSourceDialog({ onAddSource }: { onAddSource: (source: AudioSource) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up media streams
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        setAudioBlob(recordedBlob);
        // Create object URL for immediate playback
        const audioUrl = URL.createObjectURL(recordedBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setShowStopConfirmation(false);
    }
  };

  const handleStopClick = () => {
    if (isRecording) {
      setShowStopConfirmation(true);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && isRecording) {
      setShowStopConfirmation(true);
      return false;
    }
    setIsDialogOpen(open);
    return true;
  };

  const saveRecording = async () => {
    if (!audioBlob || !title.trim()) return;
    
    setIsSaving(true);
    try {
      // Create a more permanent reference to the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audioSource: AudioSource = {
        id: Date.now().toString(),
        title: title.trim(),
        type: "audio",
        duration: "0:30", // You should calculate this based on the blob
        path: audioUrl, // Using the object URL
        blob: audioBlob // Storing the blob directly for reliability
      };

      // Pass the audio source to the parent component
      onAddSource(audioSource);

      // Reset the dialog state
      setIsDialogOpen(false);
      setAudioBlob(null);
      setTitle("");
    } catch (err) {
      console.error("Error saving recording:", err);
      setError("Failed to save recording");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button 
            className="mt-2 w-full flex items-center gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Mic className="h-5 w-5" />
            Record Audio
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Audio</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm">Recording...</span>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleStopClick} 
                  className="flex items-center gap-2"
                >
                  <StopCircle className="h-5 w-5" />
                  Stop Recording
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                onClick={startRecording} 
                className="flex items-center gap-2"
                disabled={isRecording}
              >
                <Mic className="h-5 w-5" />
                {audioBlob ? "Record Again" : "Start Recording"}
              </Button>
            )}

            {audioBlob && (
              <div className="w-full space-y-4">
                <audio 
                  ref={audioRef}
                  controls 
                  src={URL.createObjectURL(audioBlob)} 
                  className="w-full" 
                />
                
                <div className="space-y-2">
                  <label htmlFor="audio-title" className="text-sm font-medium">
                    Recording Title
                  </label>
                  <Input
                    id="audio-title"
                    placeholder="Enter a title for your recording"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  onClick={saveRecording} 
                  className="mt-2 w-full" 
                  disabled={isSaving || !title.trim()}
                >
                  {isSaving ? "Saving..." : "Save Recording"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to stop recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Stopping the recording will finalize your audio clip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              stopRecording();
            }}>
              Stop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}