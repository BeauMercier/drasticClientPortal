import { supabase } from './client';
export const FILES_BUCKET = 'project-files';

export async function uploadFile(path: string, file: File | Blob) {
  return supabase.storage.from(FILES_BUCKET).upload(path, file);
} 