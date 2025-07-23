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
  
  let filePath: string;
  
  // Handle different file types
  if (source.type === 'pdf') {
    // For PDFs, still use Supabase for now (you can migrate this later if needed)
    const bucket = 'pdf_files';
    const supabaseFilePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Upload file to Supabase storage
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(supabaseFilePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading PDF file:', uploadError);
      throw uploadError;
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(supabaseFilePath);
      
    filePath = publicUrl;
  } else {
    // For audio files, use GCS
    const { uploadFileToGCSComplete } = await import('./gcsUploader');
    const uploadResult = await uploadFileToGCSComplete(file);
    filePath = uploadResult.path;
  }
    
  // Save source to database
  const { data, error } = await supabase
    .from('audio_sources')
    .insert({
      user_id: user.id,
      title: source.title,
      type: source.type,
      duration: source.duration,
      file_path: filePath,
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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated when retrieving source data");
    return null;
  }
  
  console.log(`Getting source data for source ${sourceId}, user ${user.id}`);
  
  const { data, error } = await supabase
    .from('source_data')
    .select('*')
    .eq('source_id', sourceId)
    .eq('user_id', user.id) // Add this line to explicitly match on user_id
    .maybeSingle();
    
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No data found - this is OK
      console.log(`No source data found for source ${sourceId}`);
      return null;
    }
    
    console.error('Error fetching source data:', error);
    throw error;
  }
  
  return data;
}

// New function to delete a source and its associated data and files
export async function deleteSource(sourceId: string, sourcePath: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  console.log(`Deleting source ${sourceId} with path ${sourcePath}`);
  
  try {
    // Step 1: Delete the source data
    const { error: sourceDataError } = await supabase
      .from('source_data')
      .delete()
      .eq('source_id', sourceId);
      
    if (sourceDataError) {
      console.error('Error deleting source data:', sourceDataError);
      // Continue with deletion even if this fails
    }
    
    // Step 2: Delete the source record from audio_sources
    const { error: sourceError } = await supabase
      .from('audio_sources')
      .delete()
      .eq('id', sourceId);
      
    if (sourceError) {
      console.error('Error deleting source record:', sourceError);
      throw sourceError;
    }
    
    // Step 3: Delete the file from storage
    if (sourcePath) {
      try {
        // Extract the file path from the URL
        // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlParts = sourcePath.split('/public/');
        if (urlParts.length >= 2) {
          const pathParts = urlParts[1].split('/');
          const bucketName = pathParts[0]; // This should be 'audio_files' or 'pdf_files'
          const objectPath = pathParts.slice(1).join('/');
          
          console.log(`Deleting file from bucket: ${bucketName}, path: ${objectPath}`);
          
          const { error: deleteError } = await supabase
            .storage
            .from(bucketName)
            .remove([objectPath]);
            
          if (deleteError) {
            console.error('Error deleting file from storage:', deleteError);
            // Continue even if file deletion fails
          } else {
            console.log('File deleted successfully from storage');
          }
        } else {
          console.warn('Could not parse file path from URL:', sourcePath);
        }
      } catch (error) {
        console.error('Error handling file deletion:', error);
        // Continue even if file deletion fails
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
}

// Function to get a signed URL for audio playback
export async function getSignedAudioUrl(filePath: string): Promise<string | null> {
  try {
    // Check if this is a GCS path (starts with user_id/)
    if (filePath.includes('/') && !filePath.startsWith('http')) {
      // This is a GCS path, we need to get a signed URL from our backend
      console.log('Getting signed URL for GCS file:', filePath);
      
      const { getIdToken } = await import('./getIdToken');
      const { API_BASE_URL } = await import('./constants');
      
      const token = await getIdToken();
      if (!token) {
        console.error('User not authenticated for GCS signed URL');
        return null;
      }

      // Call backend to get a signed download URL for the GCS file
      const response = await fetch(`${API_BASE_URL}/api/v1/audio/download-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath }),
      });

      if (!response.ok) {
        console.error('Failed to get GCS signed URL:', response.statusText);
        return null;
      }

      const { downloadUrl } = await response.json();
      return downloadUrl;
    }
    
    // This is a Supabase URL, handle as before
    const urlParts = filePath.split('/public/');
    if (urlParts.length < 2) {
      console.error("Invalid Supabase storage URL format:", filePath);
      return filePath; // Return original URL as fallback
    }
    
    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0];
    const objectPath = pathParts.slice(1).join('/');
    
    console.log(`Getting signed URL for Supabase bucket: ${bucketName}, path: ${objectPath}`);
    
    // Get signed URL with 1 hour expiration
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(objectPath, 3600); // 1 hour expiration
      
    if (error) {
      console.error('Error creating signed URL:', error);
      return filePath; // Return original URL as fallback
    }
    
    if (!data?.signedUrl) {
      console.error('No signed URL returned');
      return filePath; // Return original URL as fallback
    }
    
    console.log('Signed URL created successfully');
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedAudioUrl:', error);
    return filePath; // Return original URL as fallback
  }
}