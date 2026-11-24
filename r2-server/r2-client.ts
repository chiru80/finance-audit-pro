/**
 * S3-compatible client factory for Cloudflare R2.
 *
 * R2 speaks the S3 API, so we use the AWS SDK. The factory is lazy so importing
 * this module never pulls the (browser-incompatible) SDK into the client bundle.
 */
import { S3Client } from '@aws-sdk/client-s3';
import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { loadR2Config, type R2Config } from './r2-config';

let _client: S3Client | null = null;

export function createR2Client(config: R2Config = loadR2Config()): S3Client {
  const clientConfig: S3ClientConfig = {
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // R2 supports multipart uploads for large files (up to 5 TiB).
    maxAttempts: 5,
  };
  return new S3Client(clientConfig);
}

/** Cached singleton client. Call only on the server. */
export function getR2Client(): S3Client {
  if (!_client) _client = createR2Client();
  return _client;
}

export function resetR2Client(): void {
  _client = null;
}

export { type R2Config };