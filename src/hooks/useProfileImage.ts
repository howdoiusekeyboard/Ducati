import { useState, useEffect } from 'react';

interface UseProfileImageProps {
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
}

export const useProfileImage = ({ photoURL, displayName, email }: UseProfileImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset error state when photoURL changes
  useEffect(() => {
    if (photoURL) {
      setImageError(false);
      setIsLoading(true);
    }
  }, [photoURL]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Function to get optimized Google profile image URL
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return null;
    
    try {
      // Handle Google profile images
      if (url.includes('googleusercontent.com')) {
        // Remove existing size parameters and add optimized ones
        const baseUrl = url.split('=')[0];
        const optimizedUrl = `${baseUrl}=s96-c`;
        return optimizedUrl;
      }
      
      // Handle other image URLs
      return url;
    } catch (error) {
      return url;
    }
  };

  // Get fallback initials
  const getInitials = () => {
    if (displayName) {
      const names = displayName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  const shouldShowImage = photoURL && !imageError;
  const optimizedImageUrl = photoURL ? getOptimizedImageUrl(photoURL) : null;
  const initials = getInitials();

  return {
    shouldShowImage,
    optimizedImageUrl,
    initials,
    isLoading,
    handleImageLoad,
    handleImageError,
  };
};