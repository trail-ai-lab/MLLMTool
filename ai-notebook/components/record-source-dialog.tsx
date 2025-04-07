"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mic, StopCircle } from "lucide-react";
import type { AudioSource } from "../types/audio";

// Import your DB helper functions and Supabase client
import { uploadFileToStorage } from "@/lib/fileUploader";
import { insertSource } from "@/lib/databaseOperations";
import { supabase } from "@/lib/supabaseClient";

interface RecordSourceDialogProps {
  onAddSource: (source: AudioSource) => void;
}

export function RecordSourceDialog({ onAddSource }: RecordSourceDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
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
        audioChunks.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    setIsSaving(true);
    
    try {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // 2. Convert Blob to File
      const fileName = `recording-${Date.now()}.wav`;
      const file = new File([audioBlob], fileName, { type: "audio/wav" });
      
      // 3. Create the path with user ID just like in saveSource
      const filePath = `${user.id}/${fileName}`;
      
      // 4. Upload using the fileUploader that now uses the correct bucket
      await uploadFileToStorage(file, filePath);
      console.log("Recording uploaded successfully to audio_files bucket");
      
      // 5. Get the public URL using the audio_files bucket (not media)
      const { data: publicData, error: publicError } = await supabase
        .storage
        .from("audio_files")  // CHANGED: was "media", now "audio_files"
        .getPublicUrl(filePath);
        
      if (publicError) {
        throw new Error(publicError.message);
      }
      
      const publicUrl = publicData.publicUrl;
      console.log("Public URL:", publicUrl);
      
      // 6. Create a source object to pass to the parent
      const newSource = {
        id: `temp-recording-${Date.now()}`,
        title: `Recording ${new Date().toLocaleTimeString()}`,
        type: "audio" as "audio" | "pdf" | "transcript",
        path: publicUrl,
        file: file,
        duration: "00:00"
      };
      
      // 7. Use the built-in saveSource function (skipping the db insert)
      onAddSource(newSource);
      
      // 8. Reset state and close dialog
      setIsDialogOpen(false);
      setAudioBlob(null);
      setIsRecording(false);
    } catch (error) {
      console.error("Error saving recording:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mt-2 w-full flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Record Audio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording} className="flex items-center gap-2">
              <StopCircle className="h-5 w-5" />
              Stop Recording
            </Button>
          ) : (
            <Button variant="default" onClick={startRecording} className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          )}

          {audioBlob && (
            <div className="w-full">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
              <Button onClick={saveRecording} className="mt-2 w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Recording"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
