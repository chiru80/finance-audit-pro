/**
 * Next.js App Router API: R2 Presigned URLs
 *
 * Route: /api/r2/[action]
 * Actions: presign-upload, presign-download, head, list, delete
 *
 * Requires these env vars (add to .env.local and Vercel project settings):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   R2_PUBLIC_BASE_URL (optional)
 *
 * This route is server-only — secrets never reach the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---- Config ----
function getConfig() {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
  ] as const;

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing R2 env vars: ${missing.join(', ')}`);
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
}

function createClient() {
  const cfg = getConfig();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflare.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

const client = createClient();

// ---- Helpers ----
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

function bad(message: string, status = 400) {
  return json({ error: message }, status);
}

// ---- Route ----
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  try {
    const cfg = getConfig();
    const body = await req.json();

    switch (action) {
      case 'presign-upload': {
        const { key, contentType, expiresIn = 3600 } = body;
        if (!key) return bad('Missing key');
        if (!contentType) return bad('Missing contentType');

        const cmd = new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(client, cmd, {
          expiresIn: Math.min(expiresIn, 604800),
        });

        return json({
          uploadUrl,
          key,
          expiresAt: new Date(Date.now() + Math.min(expiresIn, 604800) * 1000).toISOString(),
          requiredHeaders: { 'Content-Type': contentType },
        });
      }

      case 'presign-download': {
        const { key, expiresIn = 3600 } = body;
        if (!key) return bad('Missing key');

        const cmd = new GetObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
        });

        const downloadUrl = await getSignedUrl(client, cmd, {
          expiresIn: Math.min(expiresIn, 604800),
        });

        return json({
          downloadUrl,
          key,
          expiresAt: new Date(Date.now() + Math.min(expiresIn, 604800) * 1000).toISOString(),
        });
      }

      case 'head': {
        const { key } = body;
        if (!key) return bad('Missing key');

        try {
          const res = await client.send(
            new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }),
          );
          return json({
            object: {
              key,
              size: res.ContentLength ?? 0,
              etag: res.ETag ?? '',
              lastModified: res.LastModified?.toISOString() ?? new Date().toISOString(),
              contentType: res.ContentType ?? 'application/octet-stream',
            },
          });
        } catch (e: any) {
          if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
            return json({ object: null });
          }
          throw e;
        }
      }

      case 'list': {
        const { prefix = '', maxKeys = 100 } = body;
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: cfg.bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
          }),
        );

        return json({
          objects: (res.Contents ?? []).map((obj) => ({
            key: obj.Key!,
            size: obj.Size ?? 0,
            etag: obj.ETag ?? '',
            lastModified: obj.LastModified?.toISOString() ?? new Date().toISOString(),
            contentType: '',
          })),
        });
      }

      case 'delete': {
        const { key } = body;
        if (!key) return bad('Missing key');

        await client.send(
          new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }),
        );
        return json({ success: true });
      }

      default:
        return bad(`Unknown action: ${action}`, 404);
    }
  } catch (e: any) {
    console.error('[/api/r2] error:', e);
    return bad(e.message ?? 'Internal error', 500);
  }
}