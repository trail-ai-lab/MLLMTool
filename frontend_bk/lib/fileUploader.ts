import { uploadFileToGCSComplete } from './gcsUploader';

/**
 * Uploads a file to GCS Storage.
 * @param file - The file to upload.
 * @param filePath - The path where the file will be stored in the bucket (deprecated - GCS generates its own path).
 * @returns The uploaded file data with GCS path.
 * @throws An error if the upload fails.
 */
export const uploadFileToStorage = async (file: File, filePath?: string) => {
  try {
    console.log('Uploading file to GCS:', file.name);
    
    // Upload to GCS and get the path
    const { path } = await uploadFileToGCSComplete(file);

    console.log('File uploaded successfully to GCS:', path);
    
    // Return data in a format similar to what Supabase returned
    return {
      path: path,
      fullPath: path,
      id: path, // Use path as ID since GCS doesn't return a separate ID
    };
  } catch (error) {
    console.error('Unexpected error in uploadFileToStorage:', error);
    throw new Error('An unexpected error occurred while uploading the file to GCS.');
  }
};

