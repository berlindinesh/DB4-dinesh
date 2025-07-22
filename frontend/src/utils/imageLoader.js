// Utility for loading images with proper error handling and CORS
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002';

export const loadImageWithCORS = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /uploads, construct full URL
  if (imagePath.startsWith('/uploads')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it's just a filename, assume it's in uploads
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

// Helper to add timestamp to bypass cache for problematic images
export const loadImageWithTimestamp = (imagePath) => {
  const baseUrl = loadImageWithCORS(imagePath);
  if (!baseUrl) return null;
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Date.now()}`;
};

export const createImageElement = (src, onLoad, onError) => {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // Enable CORS for image
  img.onload = onLoad;
  img.onerror = onError;
  img.src = src;
  return img;
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    createImageElement(
      src,
      () => resolve(src),
      () => reject(new Error(`Failed to load image: ${src}`))
    );
  });
};

export default { loadImageWithCORS, loadImageWithTimestamp, createImageElement, preloadImage };
