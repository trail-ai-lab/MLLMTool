import { getIdToken } from './getIdToken';
import { API_BASE_URL } from './constants';

/**
 * Gets a signed upload URL from the backend for GCS
 * @returns Object containing uploadUrl and path
 */
export const getGCSUploadUrl = async (): Promise<{ uploadUrl: string; path: string }> => {
  const token = await getIdToken();
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/audio/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Uploads a file directly to GCS using a signed URL
 * @param file - The file to upload
 * @param uploadUrl - The signed upload URL from GCS
 * @returns Promise that resolves when upload is complete
 */
export const uploadFileToGCS = async (file: File, uploadUrl: string): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'audio/webm',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to GCS: ${response.statusText}`);
  }
};

/**
 * Complete GCS upload flow: get signed URL and upload file
 * @param file - The file to upload
 * @returns Object containing the GCS path where the file was uploaded
 */
export const uploadFileToGCSComplete = async (file: File): Promise<{ path: string }> => {
  try {
    // Step 1: Get signed upload URL from backend
    const { uploadUrl, path } = await getGCSUploadUrl();
    
    // Step 2: Upload file directly to GCS
    await uploadFileToGCS(file, uploadUrl);
    
    // Step 3: Return the path for further use
    return { path };
  } catch (error) {
    console.error('Error in complete GCS upload:', error);
    throw new Error(`GCS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};