"use client"

import { createClient } from '@supabase/supabase-js';
import { Source } from '@/types/source';

// Make sure to use the NEXT_PUBLIC_ prefix for client-side env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Key must be provided in environment variables');
  throw new Error('Supabase configuration missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// User profile functions
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return data;
}

export async function createOrUpdateProfile(displayName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const updates = {
    id: user.id,
    email: user.email,
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(updates)
    .select()
    .single();
    
  if (error) throw error;
  
  return data;
}

// Audio source functions
export async function getUserSources() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('audio_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
  
  // Convert from database format to application Source type
  return data.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    duration: item.duration,
    path: item.file_path,
  })) as Source[];
}

export async function saveSource(source: Source, file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  // Determine bucket based on file type
  const bucket = source.type === 'pdf' ? 'pdf_files' : 'audio_files';
  const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  
  // Upload file to storage
  const { data: fileData, error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }
  
  // Get public URL for the file
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filePath);
    
  // Save source to database
  const { data, error } = await supabase
    .from('audio_sources')
    .insert({
      user_id: user.id,
      title: source.title,
      type: source.type,
      duration: source.duration,
      file_path: publicUrl,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error saving source:', error);
    throw error;
  }
  
  return {
    id: data.id,
    title: data.title,
    type: data.type,
    duration: data.duration,
    path: data.file_path,
  } as Source;
}

export async function saveSourceData(sourceId: string, data: { 
  transcript?: string; 
  summary?: string; 
  textContent?: string; 
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  const updates = {
    source_id: sourceId,
    user_id: user.id,
    ...data,
    updated_at: new Date().toISOString(),
  };
  
  const { data: result, error } = await supabase
    .from('source_data')
    .upsert(updates)
    .select();
    
  if (error) {
    console.error('Error saving source data:', error);
    throw error;
  }
  
  return result;
}

export async function getSourceData(sourceId: string) {
  const { data, error } = await supabase
    .from('source_data')
    .select('*')
    .eq('source_id', sourceId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    console.error('Error fetching source data:', error);
    throw error;
  }
  
  return data;
}