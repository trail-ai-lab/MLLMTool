import { supabase } from './supabaseClient';

/**
 * Uploads a file to Supabase Storage.
 * @param file - The file to upload.
 * @param filePath - The path where the file will be stored in the bucket.
 * @returns The uploaded file data.
 * @throws An error if the upload fails.
 */
export const uploadFileToStorage = async (file: File, filePath: string) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('media') // Ensure the bucket name is correct
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log('File uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error in uploadFileToStorage:', error);
    throw new Error('An unexpected error occurred while uploading the file.');
  }
};