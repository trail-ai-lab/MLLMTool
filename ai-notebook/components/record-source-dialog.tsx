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
      // Convert Blob to File
      const fileName = `recording-${Date.now()}.wav`;
      const file = new File([audioBlob], fileName, { type: "audio/wav" });
      
      // Define the file path in your storage bucket
      const filePath = `audio/${fileName}`;

      // Upload the file to Supabase Storage
      await uploadFileToStorage(file, filePath);
      console.log("File uploaded successfully");

      // Retrieve the public URL for the uploaded file
      const { data: publicData, error: publicError } = await supabase
        .storage
        .from("media")
        .getPublicUrl(filePath);
      if (publicError) {
        throw new Error(publicError.message);
      }
      const publicUrl = publicData.publicUrl;
      console.log("Public URL:", publicUrl);

      // Insert a new source record into the DB using the public URL
      const newSource = await insertSource({
        title: `Recording ${new Date().toLocaleTimeString()}`,
        type: "audio",
        file_path: publicUrl,
        duration: "Unknown", // Update if you calculate duration
      });

      // Map the returned DB record to an AudioSource object
      const audioSource: AudioSource = {
        id: newSource.id,
        title: newSource.title,
        type: "audio",
        duration: newSource.duration,
        path: newSource.file_path, // This now contains the public URL
      };

      // Pass the new AudioSource to the parent component
      onAddSource(audioSource);

      // Reset state and close the dialog
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
