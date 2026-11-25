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
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const supabase = createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : (data.user?.id ?? null);
}

function objectKey(userId: string, key: unknown): string | null {
  if (typeof key !== 'string' || !key.trim() || key.includes('\\') || key.split('/').includes('..'))
    return null;
  const normalized = key.replace(/^\/+/, '');
  return normalized.startsWith(`${userId}/`) ? normalized : `${userId}/${normalized}`;
}

// ---- Helpers ----
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://weeklyfinance.online',
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const userId = await getUserId(req);
  if (!userId) return bad('Authentication required', 401);

  try {
    const cfg = getConfig();
    const body = await req.json();

    switch (action) {
      case 'presign-upload': {
        const { key: rawKey, contentType, expiresIn = 3600 } = body;
        const key = objectKey(userId, rawKey);
        if (!key) return bad('Invalid key');
        if (typeof contentType !== 'string' || !contentType || contentType.length > 255)
          return bad('Invalid contentType');

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
        const { key: rawKey, expiresIn = 3600 } = body;
        const key = objectKey(userId, rawKey);
        if (!key) return bad('Invalid key');

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
        const key = objectKey(userId, body.key);
        if (!key) return bad('Invalid key');

        try {
          const res = await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
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
        if (typeof prefix !== 'string' || prefix.includes('\\') || prefix.split('/').includes('..'))
          return bad('Invalid prefix');
        const scopedPrefix = `${userId}/${prefix.replace(/^\/+/, '')}`;
        const safeMaxKeys = Number.isInteger(maxKeys) ? Math.min(Math.max(maxKeys, 1), 1000) : 100;
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: cfg.bucket,
            Prefix: scopedPrefix,
            MaxKeys: safeMaxKeys,
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
        const key = objectKey(userId, body.key);
        if (!key) return bad('Invalid key');

        await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
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
