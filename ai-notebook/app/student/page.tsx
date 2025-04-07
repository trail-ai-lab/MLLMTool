"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Mic, StopCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/language-context";

export default function StudentView() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { language } = useLanguage();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setUploadSuccess(false);
      
      // Start collecting data every 100ms
      const timer = setInterval(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
        }
      }, 100);
      
      // Cleanup timer when recording stops
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timer);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      };
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: language === "en" ? "Recording Error" : "Error de grabación",
        description: language === "en" 
          ? "Could not access microphone. Please check permissions." 
          : "No se pudo acceder al micrófono. Por favor verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    
    try {
      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `recording-${timestamp}.wav`;
      
      // Convert Blob to File
      const audioFile = new File([audioBlob], filename, { type: "audio/wav" });
      
      // Upload to Supabase storage
      const filePath = `student_recordings/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from('recordings') // Make sure this bucket exists in your Supabase
        .upload(filePath, audioFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);
      
      // Save metadata to your database table
      const { error: dbError } = await supabase
        .from('student_recordings') // Make sure this table exists
        .insert([{
          file_path: filePath,
          public_url: urlData.publicUrl,
          title: `Student Recording - ${new Date().toLocaleString()}`,
          duration: Math.round(audioBlob.size / (16000 * 2)), // Approximate duration in seconds
          uploaded_at: new Date().toISOString()
        }]);
      
      if (dbError) throw dbError;
      
      setUploadSuccess(true);
      toast({
        title: language === "en" ? "Success" : "Éxito",
        description: language === "en" 
          ? "Your recording has been uploaded successfully!" 
          : "¡Tu grabación se ha subido correctamente!",
      });
      
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast({
        title: language === "en" ? "Upload Error" : "Error de subida",
        description: language === "en" 
          ? "Could not upload recording. Please try again." 
          : "No se pudo subir la grabación. Por favor intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadSuccess(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {language === "en" ? "Audio Recording" : "Grabación de Audio"}
        </h1>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {!isRecording && !audioUrl ? (
              <Button 
                onClick={startRecording}
                size="lg"
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                {language === "en" ? "Start Recording" : "Comenzar Grabación"}
              </Button>
            ) : isRecording ? (
              <Button 
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="gap-2"
              >
                <StopCircle className="h-5 w-5" />
                {language === "en" ? "Stop Recording" : "Detener Grabación"}
              </Button>
            ) : null}
          </div>
          
          {audioUrl && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <audio controls src={audioUrl} className="w-full" />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={uploadRecording}
                  disabled={isUploading || uploadSuccess}
                  className="flex-1 gap-2"
                >
                  {isUploading ? (
                    <span className="animate-pulse">
                      {language === "en" ? "Uploading..." : "Subiendo..."}
                    </span>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      {language === "en" ? "Uploaded" : "Subido"}
                    </>
                  ) : (
                    <>
                      {language === "en" ? "Upload Recording" : "Subir Grabación"}
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetRecording}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {language === "en" ? "New Recording" : "Nueva Grabación"}
                </Button>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            {language === "en" 
              ? "Record your audio and submit it to your teacher." 
              : "Graba tu audio y envíalo a tu profesor."}
          </p>
        </div>
      </Card>
    </div>
  );
}