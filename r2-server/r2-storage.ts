/**
 * High-level R2 storage operations.
 *
 * These are server-only functions. The browser NEVER calls them directly.
 * Instead, the browser requests a presigned URL from an API route, then uploads
 * directly to R2 (or downloads from a presigned GET URL).
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, type R2Config, loadR2Config } from './r2-client';

export interface UploadOptions {
  /** Object key (path within the bucket). */
  key: string;
  /** File contents. Can be Buffer, ReadableStream, Blob, or string. */
  body: Buffer | Uint8Array | ReadableStream<Uint8Array> | string;
  /** Content-Type header. If omitted, inferred from key extension. */
  contentType?: string;
  /** Cache-Control header. Default: 'private, max-age=0, must-revalidate'. */
  cacheControl?: string;
  /** Optional metadata. All keys/values must be strings. */
  metadata?: Record<string, string>;
  /** Overwrite if object exists? Default: true. */
  overwrite?: boolean;
}

export interface UploadResult {
  key: string;
  etag: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlOptions {
  key: string;
  /** HTTP method for the presigned URL. */
  method: 'PUT' | 'GET' | 'DELETE';
  /** Expiry in seconds. Default: 3600 (1 hour). Max: 604800 (7 days). */
  expiresIn?: number;
  /** For PUT: content-type the client MUST send. For GET: optional. */
  contentType?: string;
}

export interface ObjectMetadata {
  key: string;
  size: number;
  etag: string;
  lastModified: Date;
  contentType: string;
  metadata: Record<string, string>;
}

/**
 * Upload a file to R2 directly from the server.
 * Use this for server-side uploads (webhooks, cron jobs, small files).
 * For browser uploads, use createPresignedUploadUrl() instead.
 */
export async function uploadFile(
  opts: UploadOptions,
  config: R2Config = loadR2Config(),
): Promise<UploadResult> {
  const client = createR2Client(config);
  const contentType =
    opts.contentType ??
    inferContentType(opts.key) ??
    'application/octet-stream';

  const body =
    typeof opts.body === 'string'
      ? new TextEncoder().encode(opts.body)
      : opts.body instanceof Uint8Array
        ? opts.body
        : opts.body; // ReadableStream

  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: opts.key,
    Body: body as any,
    ContentType: contentType,
    CacheControl: opts.cacheControl ?? 'private, max-age=0, must-revalidate',
    Metadata: opts.metadata,
  });

  const res = await client.send(cmd);
  return {
    key: opts.key,
    etag: res.ETag ?? '',
    size: byteLength(body),
    contentType,
  };
}

/**
 * Generate a presigned PUT URL for direct browser → R2 upload.
 * The browser calls this API, receives { uploadUrl, key, expiresAt },
 * then does: `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': ... } })`
 */
export async function createPresignedUploadUrl(
  opts: PresignedUrlOptions & { method: 'PUT' },
  config: R2Config = loadR2Config(),
): Promise<{ uploadUrl: string; key: string; expiresAt: Date; requiredHeaders: Record<string, string> }> {
  const client = createR2Client(config);
  const expiresIn = Math.min(opts.expiresIn ?? 3600, 604800);

  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: opts.key,
    ContentType: opts.contentType,
  });

  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn });
  const requiredHeaders: Record<string, string> = {};
  if (opts.contentType) requiredHeaders['Content-Type'] = opts.contentType;

  return {
    uploadUrl,
    key: opts.key,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    requiredHeaders,
  };
}

/**
 * Generate a presigned GET URL for direct browser download.
 * Use for private objects. For public objects, use publicUrl() instead.
 */
export async function createPresignedDownloadUrl(
  opts: PresignedUrlOptions & { method: 'GET' },
  config: R2Config = loadR2Config(),
): Promise<{ downloadUrl: string; key: string; expiresAt: Date }> {
  const client = createR2Client(config);
  const expiresIn = Math.min(opts.expiresIn ?? 3600, 604800);

  const cmd = new GetObjectCommand({
    Bucket: config.bucket,
    Key: opts.key,
  });

  const downloadUrl = await getSignedUrl(client, cmd, { expiresIn });
  return {
    downloadUrl,
    key: opts.key,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

/** Delete an object from R2. */
export async function deleteFile(
  key: string,
  config: R2Config = loadR2Config(),
): Promise<void> {
  const client = createR2Client(config);
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
  );
}

/** Check if an object exists and return its metadata. */
export async function headObject(
  key: string,
  config: R2Config = loadR2Config(),
): Promise<ObjectMetadata | null> {
  const client = createR2Client(config);
  try {
    const res = await client.send(
      new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    return {
      key,
      size: res.ContentLength ?? 0,
      etag: res.ETag ?? '',
      lastModified: res.LastModified ?? new Date(),
      contentType: res.ContentType ?? 'application/octet-stream',
      metadata: res.Metadata ?? {},
    };
  } catch (e: any) {
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

/** List objects under a prefix (folder). */
export async function listObjects(
  prefix: string,
  config: R2Config = loadR2Config(),
  maxKeys = 1000,
): Promise<ObjectMetadata[]> {
  const client = createR2Client(config);
  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );

  return (res.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    etag: obj.ETag ?? '',
    lastModified: obj.LastModified ?? new Date(),
    contentType: '', // not returned by ListObjects
    metadata: {},
  }));
}

/** Copy an object within the same bucket (or across buckets with config override). */
export async function copyObject(
  sourceKey: string,
  destKey: string,
  config: R2Config = loadR2Config(),
): Promise<void> {
  const client = createR2Client(config);
  await client.send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      CopySource: `${config.bucket}/${sourceKey}`,
      Key: destKey,
    }),
  );
}

/** Infer Content-Type from file extension. Very small map — extend as needed. */
function inferContentType(key: string): string | undefined {
  const ext = key.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    // Data
    json: 'application/json',
    xml: 'application/xml',
    // Archives
    zip: 'application/zip',
    gz: 'application/gzip',
    // Audio/Video
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };
  return ext ? map[ext] : undefined;
}

function byteLength(body: UploadOptions['body']): number {
  if (typeof body === 'string') return new TextEncoder().encode(body).length;
  if (body instanceof Uint8Array) return body.length;
  if (body instanceof Buffer) return body.length;
  // ReadableStream - unknown size
  return -1;
}

// Re-export client factory for advanced use cases
export { createR2Client, getR2Client, loadR2Config, type R2Config } from './r2-client';