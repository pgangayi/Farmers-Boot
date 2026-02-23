/**
 * ============================================================================
 * STORAGE UTILITIES
 * ============================================================================
 * Storage utilities for Supabase Storage
 * ============================================================================
 */

import { supabase } from './supabase-client.ts';

export interface StorageUploadOptions {
  bucket: string;
  path: string;
  file: File | Uint8Array | string;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  path: string;
  fullPath: string;
  url?: string;
}

export interface StorageDeleteOptions {
  bucket: string;
  paths: string[];
}

// Default buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
  VIDEOS: 'videos',
  BACKUPS: 'backups',
} as const;

// Upload file to Supabase Storage
export async function uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
  const { bucket, path, file, contentType, upsert = false } = options;

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL if bucket is public
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path: data.path,
    fullPath: data.fullPath,
    url: publicUrlData?.publicUrl,
  };
}

// Delete files from Supabase Storage
export async function deleteFiles(options: StorageDeleteOptions): Promise<void> {
  const { bucket, paths } = options;

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

// Get public URL for a file
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Get signed URL for private files
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 60
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// List files in a bucket
export async function listFiles(
  bucket: string,
  path?: string,
  limit: number = 100,
  offset: number = 0
) {
  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit,
    offset,
  });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}

// Get file info
export async function getFileInfo(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).getPublicUrl(path);

  if (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }

  return data;
}

// Generate unique file path
export function generateFilePath(
  userId: string,
  originalName: string,
  folder: string = ''
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(`.${extension}`, '');

  const parts = [userId];
  if (folder) {
    parts.push(folder);
  }
  parts.push(`${timestamp}-${randomString}-${baseName}.${extension}`);

  return parts.join('/');
}

// Validate file type
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Validate file size
export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes;
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Get MIME type from extension
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Allowed MIME types by bucket
export const ALLOWED_MIME_TYPES = {
  [STORAGE_BUCKETS.AVATARS]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  [STORAGE_BUCKETS.DOCUMENTS]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  [STORAGE_BUCKETS.IMAGES]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  [STORAGE_BUCKETS.VIDEOS]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [STORAGE_BUCKETS.BACKUPS]: ['application/zip', 'application/gzip', 'application/x-tar'],
};

// Max file sizes by bucket (in bytes)
export const MAX_FILE_SIZES = {
  [STORAGE_BUCKETS.AVATARS]: 5 * 1024 * 1024, // 5MB
  [STORAGE_BUCKETS.DOCUMENTS]: 10 * 1024 * 1024, // 10MB
  [STORAGE_BUCKETS.IMAGES]: 10 * 1024 * 1024, // 10MB
  [STORAGE_BUCKETS.VIDEOS]: 100 * 1024 * 1024, // 100MB
  [STORAGE_BUCKETS.BACKUPS]: 500 * 1024 * 1024, // 500MB
};
