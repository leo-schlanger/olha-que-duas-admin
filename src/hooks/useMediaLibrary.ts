import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

const BUCKET = 'media-library';

export function useMediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list('', {
          limit: 200,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listError) throw listError;

      const mediaFiles: MediaFile[] = (data || [])
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(f.name);

          return {
            id: f.id,
            name: f.name,
            url: urlData.publicUrl,
            size: f.metadata?.size || 0,
            mimeType: f.metadata?.mimetype || 'image/png',
            createdAt: f.created_at,
          };
        });

      setFiles(mediaFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ficheiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File): Promise<MediaFile | null> => {
    setUploading(true);
    setError(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas');
      }

      const ext = file.name.split('.').pop();
      const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
      const fileName = `${safeName}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      const newFile: MediaFile = {
        id: fileName,
        name: fileName,
        url: urlData.publicUrl,
        size: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
      };

      setFiles((prev) => [newFile, ...prev]);
      return newFile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadFiles = async (fileList: File[]): Promise<number> => {
    setUploading(true);
    setError(null);
    let successCount = 0;

    try {
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) continue;

        const ext = file.name.split('.').pop();
        const safeName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 50);
        const fileName = `${safeName}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, file);

        if (!uploadError) successCount++;
      }

      await fetchFiles();
      return successCount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      return successCount;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([fileName]);

      if (deleteError) throw deleteError;

      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir ficheiro');
      return false;
    }
  };

  return {
    files,
    loading,
    uploading,
    error,
    fetchFiles,
    uploadFile,
    uploadFiles,
    deleteFile,
  };
}
