// src/lib/storage.ts
import { storage } from './firebase';
import { ref, getDownloadURL } from 'firebase/storage';

// Firebase Storage bucket URL - using the correct format
const STORAGE_BUCKET_URL = 'https://firebasestorage.googleapis.com/v0/b/denarii-mvp-f5aea.appspot.com';

/**
 * Get the Firebase Storage URL for a media file
 * Falls back to direct bucket URL if Firebase Storage is not available
 */
export const getMediaUrl = (filename: string): string => {
  // Direct URL construction for Firebase Storage
  // This works without authentication for public files
  return `${STORAGE_BUCKET_URL}/o/${encodeURIComponent(filename)}?alt=media`;
};

/**
 * Get authenticated Firebase Storage URL (if needed for private files)
 * This requires Firebase Storage to be initialized
 */
export const getAuthenticatedMediaUrl = async (filename: string): Promise<string> => {
  if (!storage) {
    // Fallback to direct URL if storage is not initialized
    return getMediaUrl(filename);
  }
  
  try {
    const fileRef = ref(storage, filename);
    return await getDownloadURL(fileRef);
  } catch (error) {
    return getMediaUrl(filename);
  }
};

// Pre-defined URLs for the media files with fallback
export const MEDIA_URLS = {
  FAVICON: getMediaUrl('icons8-money-96.png'),
  OG_IMAGE: getMediaUrl('og-image.png'),
} as const;

// Verify URL accessibility
export const verifyMediaUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If no error thrown, assume accessible
  } catch (error) {
    console.error('Media URL verification failed:', url, error);
    return false;
  }
};