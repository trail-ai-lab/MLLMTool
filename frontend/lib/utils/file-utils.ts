/**
 * Removes file extension from a filename
 * @param filename - The filename with or without extension
 * @returns The filename without extension
 */
export function removeFileExtension(filename: string): string {
  if (!filename) return filename
  
  // Find the last dot in the filename
  const lastDotIndex = filename.lastIndexOf('.')
  
  // If no dot found or dot is at the beginning, return original filename
  if (lastDotIndex <= 0) return filename
  
  // Return filename without extension
  return filename.substring(0, lastDotIndex)
}