import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET } from '../constants/storageConfig';
import { validateUploadFile } from '../utils/validators';

function extractStoragePathFromUrl(publicUrl) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadMediaFile(file, { folder = 'posts', imagesOnly = false } = {}) {
  const check = validateUploadFile(file, { imagesOnly });
  if (!check.valid) {
    throw new Error(check.error);
  }

  const safeExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;
  const storagePath = `${folder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload file to storage.');
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  return {
    fileName: file.name,
    fileUrl: data.publicUrl,
    fileType: file.type,
    fileSizeBytes: file.size,
    storagePath,
  };
}

export async function deleteMediaByUrl(publicUrl) {
  const path = extractStoragePathFromUrl(publicUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.warn('Unable to remove orphaned file from storage:', error.message);
  }
}