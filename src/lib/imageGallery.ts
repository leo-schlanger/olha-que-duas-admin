/**
 * Image Gallery Service
 * Stores uploaded images in localStorage for reuse
 */

const STORAGE_KEY = 'newsletter_image_gallery';
const MAX_IMAGES = 50; // Maximum images to store

export interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
  uploadedAt: string;
}

/**
 * Get all images from gallery
 */
export function getGalleryImages(): GalleryImage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as GalleryImage[];
  } catch {
    return [];
  }
}

/**
 * Add image to gallery
 */
export function addToGallery(image: Omit<GalleryImage, 'id' | 'uploadedAt'>): GalleryImage {
  const images = getGalleryImages();

  // Check if image already exists
  const exists = images.some(img => img.url === image.url);
  if (exists) {
    return images.find(img => img.url === image.url)!;
  }

  const newImage: GalleryImage = {
    ...image,
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString(),
  };

  // Add to beginning, limit to MAX_IMAGES
  const updatedImages = [newImage, ...images].slice(0, MAX_IMAGES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedImages));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  return newImage;
}

/**
 * Remove image from gallery
 */
export function removeFromGallery(id: string): void {
  const images = getGalleryImages();
  const filtered = images.filter(img => img.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Clear all images from gallery
 */
export function clearGallery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}
