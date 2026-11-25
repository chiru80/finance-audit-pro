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

async function verifyUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseKey },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user?.id ?? null;
}

function scopeKey(rawKey: unknown, userId: string): string | null {
  if (typeof rawKey !== 'string') return null;
  const trimmed = rawKey.trim().replace(/^\/+/, '');
  if (!trimmed || trimmed.includes('\0') || trimmed.split('/').some((seg) => seg === '..' || seg === '.')) {
    return null;
  }
  return trimmed.startsWith(`${userId}/`) ? trimmed : `${userId}/${trimmed}`;
}

function clampExpiresIn(raw: unknown): number {
  const num = typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : 3600;
  return Math.min(Math.max(num, 1), 604800);
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
    const userId = await verifyUser(req);
    if (!userId) {
      return bad('Unauthorized', 401);
    }

    const cfg = getConfig();
    const body = await req.json();

    switch (action) {
      case 'presign-upload': {
        const key = scopeKey(body.key, userId);
        const { contentType } = body;
        const expiresIn = clampExpiresIn(body.expiresIn);
        if (!key) return bad('Invalid or missing key');
        if (typeof contentType !== 'string' || !contentType.trim()) {
          return bad('Missing contentType');
        }

        const cmd = new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(client, cmd, { expiresIn });

        return json({
          uploadUrl,
          key,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          requiredHeaders: { 'Content-Type': contentType },
        });
      }

      case 'presign-download': {
        const key = scopeKey(body.key, userId);
        const expiresIn = clampExpiresIn(body.expiresIn);
        if (!key) return bad('Invalid or missing key');

        const cmd = new GetObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
        });

        const downloadUrl = await getSignedUrl(client, cmd, { expiresIn });

        return json({
          downloadUrl,
          key,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        });
      }

      case 'head': {
        const key = scopeKey(body.key, userId);
        if (!key) return bad('Invalid or missing key');

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
        const rawPrefix = typeof body.prefix === 'string' ? body.prefix.trim().replace(/^\/+/, '') : '';
        if (rawPrefix.includes('\0') || rawPrefix.split('/').some((seg: string) => seg === '..' || seg === '.')) {
          return bad('Invalid prefix');
        }
        const prefix = rawPrefix.startsWith(`${userId}/`) ? rawPrefix : `${userId}/${rawPrefix}`;
        const maxKeys =
          typeof body.maxKeys === 'number' && Number.isFinite(body.maxKeys)
            ? Math.min(Math.max(Math.floor(body.maxKeys), 1), 1000)
            : 100;
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
        const key = scopeKey(body.key, userId);
        if (!key) return bad('Invalid or missing key');

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