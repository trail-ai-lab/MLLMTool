// components/create-link-button.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, Copy, Check, Plus } from "lucide-react"; // Changed from LinkPlus to Link
import { createRecordingLink } from "@/lib/linkStorage";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabaseClient";

interface FormData {
  title: string;
  description: string;
  expiresInDays: number;
  maxUses: number;
}

export function CreateLinkButton(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    expiresInDays: 7,
    maxUses: 50
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { language } = useLanguage();
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'expiresInDays' || name === 'maxUses' 
        ? parseInt(value, 10) 
        : value
    }));
  };
  
  // Generate a new recording link
  const handleCreateLink = async () => {
    try {
      // Get current user
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      
      // Create the link
      const newLink = createRecordingLink(formData, user.id);
      
      // Generate the full URL
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/record/${newLink.id}`;
      
      setGeneratedLink(fullUrl);
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    if (!generatedLink) return;
    
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    
    // Reset copy status after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  // Reset the form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      expiresInDays: 7,
      maxUses: 50
    });
    setGeneratedLink(null);
    setIsCopied(false);
  };
  
  // Close dialog and reset
  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <div className="flex items-center">
            <Link className="h-4 w-4 mr-1" />
            <Plus className="h-3 w-3" />
          </div>
          <span className="ml-1">
            {language === "en" ? "Create Recording Link" : "Crear Enlace de Grabación"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {language === "en" ? "Create Recording Link" : "Crear Enlace de Grabación"}
          </DialogTitle>
          <DialogDescription>
            {language === "en" 
              ? "Generate a link that allows students to submit recordings directly to you." 
              : "Genera un enlace que permite a los estudiantes enviarte grabaciones directamente."}
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {language === "en" ? "Title" : "Título"}
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={language === "en" ? "Assignment Title" : "Título de la Tarea"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">
                  {language === "en" ? "Instructions" : "Instrucciones"}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={language === "en" ? "Instructions for students" : "Instrucciones para estudiantes"}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresInDays">
                    {language === "en" ? "Expires In (days)" : "Expira En (días)"}
                  </Label>
                  <Input
                    id="expiresInDays"
                    name="expiresInDays"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.expiresInDays}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUses">
                    {language === "en" ? "Maximum Uses" : "Usos Máximos"}
                  </Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxUses}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleCreateLink}
                disabled={!formData.title}
              >
                {language === "en" ? "Generate Link" : "Generar Enlace"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium mb-2">{language === "en" ? "Your link is ready:" : "Tu enlace está listo:"}</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === "en" 
                    ? "Share this link with your students. They will be able to record and submit audio without signing in." 
                    : "Comparte este enlace con tus estudiantes. Podrán grabar y enviar audio sin iniciar sesión."}
                </p>
                
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? `Link expires in ${formData.expiresInDays} days and can be used up to ${formData.maxUses} times.`
                    : `El enlace expira en ${formData.expiresInDays} días y puede usarse hasta ${formData.maxUses} veces.`}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="secondary" onClick={resetForm}>
                {language === "en" ? "Create Another Link" : "Crear Otro Enlace"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}