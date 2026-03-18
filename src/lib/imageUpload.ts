/**
 * ImgBB Image Upload Service
 * Free image hosting with no time limit
 * Get your API key at: https://api.imgbb.com/
 */

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Convert a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to ImgBB
 * @param file - The image file to upload
 * @returns Upload result with URLs or error
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    console.error('ImgBB API key not configured');
    return {
      success: false,
      error: 'Serviço de upload não configurado. Contacta o administrador.',
    };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Por favor seleciona uma imagem válida (JPG, PNG, GIF)',
    };
  }

  // Validate file size (max 32MB for ImgBB)
  const maxSize = 32 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'A imagem deve ter no máximo 32MB',
    };
  }

  try {
    const base64Image = await fileToBase64(file);

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64Image);
    formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ImgBBResponse = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.data.display_url,
        thumbnailUrl: result.data.thumb?.url,
      };
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: 'Erro ao fazer upload da imagem. Tenta novamente.',
    };
  }
}

/**
 * Upload multiple images
 * @param files - Array of image files
 * @returns Array of upload results
 */
export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  const results = await Promise.all(files.map(uploadImage));
  return results;
}
