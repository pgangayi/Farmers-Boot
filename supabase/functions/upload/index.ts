/**
 * ============================================================================
 * UPLOAD EDGE FUNCTION
 * ============================================================================
 * Handles file upload requests using Supabase Storage
 * ============================================================================
 */

import { supabase, getUserFromAuth } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../_shared/error-handler.ts';
import { logger } from '../_shared/logger.ts';
import {
  uploadFile,
  getPublicUrl,
  getSignedUrl,
  generateFilePath,
  validateFileType,
  validateFileSize,
  STORAGE_BUCKETS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES,
} from '../_shared/storage.ts';

export async function handleUploadRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/upload', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Upload request: ${method} ${path}`);

  try {
    if (path === '' && method === 'POST') {
      return await handleUpload(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const filePath = path.substring(1);
      return await handleGetFile(req, filePath, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const filePath = path.substring(1);
      return await handleDeleteFile(req, filePath, requestId);
    } else if (path.match(/^\/[^\/]+\/signed-url$/) && method === 'GET') {
      const filePath = path.substring(1, path.lastIndexOf('/signed-url'));
      return await handleGetSignedUrl(req, filePath, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Upload endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleUpload(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const bucket = (formData.get('bucket') as string) || STORAGE_BUCKETS.IMAGES;
  const folder = (formData.get('folder') as string) || '';

  if (!file) {
    throw new ValidationError('No file provided');
  }

  // Validate bucket
  if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
    throw new ValidationError('Invalid bucket');
  }

  // Validate file type
  const allowedTypes = ALLOWED_MIME_TYPES[bucket] || [];
  if (!validateFileType(file, allowedTypes)) {
    throw new ValidationError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  const maxSize = MAX_FILE_SIZES[bucket] || 10 * 1024 * 1024;
  if (!validateFileSize(file, maxSize)) {
    throw new ValidationError(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
  }

  // Generate file path
  const filePath = generateFilePath(user.id, file.name, folder);

  // Upload file
  const result = await uploadFile({
    bucket,
    path: filePath,
    file,
    contentType: file.type,
    upsert: false,
  });

  logger.info(`File uploaded: ${result.path}`);

  return createSuccessResponse(
    {
      path: result.path,
      url: result.url,
      bucket,
      size: file.size,
      type: file.type,
    },
    201
  );
}

async function handleGetFile(req: Request, filePath: string, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') || STORAGE_BUCKETS.IMAGES;

  // Validate bucket
  if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
    throw new ValidationError('Invalid bucket');
  }

  // Get public URL
  const publicUrl = getPublicUrl(bucket, filePath);

  return createSuccessResponse({
    path: filePath,
    url: publicUrl,
    bucket,
  });
}

async function handleGetSignedUrl(
  req: Request,
  filePath: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') || STORAGE_BUCKETS.DOCUMENTS;
  const expiresIn = parseInt(url.searchParams.get('expires_in') || '3600', 10);

  // Validate bucket
  if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
    throw new ValidationError('Invalid bucket');
  }

  // Get signed URL
  const signedUrl = await getSignedUrl(bucket, filePath, expiresIn);

  return createSuccessResponse({
    path: filePath,
    signed_url: signedUrl,
    expires_in: expiresIn,
    bucket,
  });
}

async function handleDeleteFile(
  req: Request,
  filePath: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') || STORAGE_BUCKETS.IMAGES;

  // Validate bucket
  if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
    throw new ValidationError('Invalid bucket');
  }

  // Check if user owns the file (path starts with user ID)
  if (!filePath.startsWith(user.id)) {
    throw new AuthenticationError('You do not have permission to delete this file');
  }

  // Delete file
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error('Failed to delete file');
  }

  logger.info(`File deleted: ${filePath}`);

  return createSuccessResponse({ message: 'File deleted successfully' });
}
