import { apiUpload } from '@/lib/apiClient';

export type UploadFolder = 'pets' | 'shelters';

interface UploadResponse {
  url: string;
}

/**
 * Sends one image to the backend, which stores it in Supabase Storage and
 * returns the public URL. Only the URL is ever kept in the database.
 */
export const uploadImage = async (file: File, folder: UploadFolder): Promise<string> => {
  const body = new FormData();
  body.append('image', file);
  body.append('folder', folder);
  const { url } = await apiUpload<UploadResponse>('/uploads', body);
  return url;
};
