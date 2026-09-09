// Upload infrastructure — validates and processes image uploads for
// future screenshot analysis.
//
// // TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS
// // TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS
// Do NOT implement OCR or vision here. This module only handles file
// validation and creates typed UploadedImage records.

import type { UploadedImage, UploadAnalysisStatus } from '@/types';
import { uid } from '@/services/utils/uid';

const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const ACCEPTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for type and size before processing.
 */
export function validateImageFile(file: File): UploadValidationResult {
  // Check MIME type (may be missing for some browsers/OS).
  if (file.type && !ACCEPTED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Use PNG, JPG, or WEBP.` };
  }

  // Fallback: check extension if MIME type is empty.
  if (!file.type) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Unsupported file type. Use PNG, JPG, or WEBP.` };
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${formatBytes(file.size)}). Max size is 10 MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true };
}

/**
 * Reads a file as a data URL (base64) for preview display.
 */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a typed UploadedImage record from a validated file.
 * The analysis status starts as 'pending'.
 */
export async function createUploadedImage(file: File): Promise<UploadedImage> {
  const previewUrl = await readAsDataUrl(file);
  return {
    id: uid(),
    filename: file.name,
    mimeType: file.type || guessMimeFromExtension(file.name),
    size: file.size,
    previewUrl,
    createdAt: Date.now(),
    analysisStatus: 'pending' as UploadAnalysisStatus,
  };
}

/**
 * Updates the analysis status on an UploadedImage.
 */
export function withAnalysisStatus(
  image: UploadedImage,
  status: UploadAnalysisStatus,
): UploadedImage {
  return { ...image, analysisStatus: status };
}

/**
 * Accept string for <input accept="...">.
 */
export const ACCEPT_STRING = 'image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp';

// ---- helpers ----

function guessMimeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return map[ext] ?? 'application/octet-stream';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
