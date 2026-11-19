import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../constants/storageConfig';

export function validateUploadFile(file, { imagesOnly = false } = {}) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const allowedTypes = imagesOnly ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_ATTACHMENT_MIME_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: imagesOnly
        ? 'Invalid image format. Only JPG, PNG, and WEBP images are allowed.'
        : 'Invalid file format. Only JPG, PNG, WEBP images and PDF documents are allowed.',
    };
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 5 MB maximum size limit.`,
    };
  }

  return { valid: true, error: '' };
}