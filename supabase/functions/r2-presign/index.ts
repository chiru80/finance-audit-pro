/**
 * Supabase Edge Function: R2 Presigned URL Generation
 *
 * Deploy:
 *   supabase functions deploy r2-presign
 *
 * Required secrets (set via `supabase secrets set` or Dashboard):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *
 * Optional:
 *   R2_PUBLIC_BASE_URL  -- if bucket has public read enabled
 *   ALLOWED_ORIGIN      -- CORS allow-origin (defaults to '*')
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from 'https://esm.sh/@aws-sdk/client-s3@3.500.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.500.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Env {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET: string;
  R2_PUBLIC_BASE_URL?: string;
}

function getEnv(): Env {
  const env = Deno.env.toObject();
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing secret: ${k}`);
  }
  return env as unknown as Env;
}

function createR2Client(env: Env): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflare.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Validate and scope an object key under the authenticated user's prefix. */
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    // Verify authenticated Supabase session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return error('Missing Authorization header', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return error('Server auth configuration missing', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return error('Invalid or expired session', 401);
    }

    const env = getEnv();
    const client = createR2Client(env);
    const body = await req.json();
    const urlPathAction = new URL(req.url).pathname.split('/').filter(Boolean).pop();
    const knownActions = new Set(['presign-upload', 'presign-download', 'head', 'list', 'delete']);
    const action = body.action ?? (urlPathAction && knownActions.has(urlPathAction) ? urlPathAction : undefined);
    const params = body;

    switch (action) {
      case 'presign-upload': {
        const key = scopeKey(params.key, user.id);
        const { contentType } = params;
        const expiresIn = clampExpiresIn(params.expiresIn);
        if (!key) return error('Invalid or missing key');
        if (typeof contentType !== 'string' || !contentType.trim()) {
          return error('Missing contentType');
        }

        const cmd = new PutObjectCommand({
          Bucket: env.R2_BUCKET,
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
        const key = scopeKey(params.key, user.id);
        const expiresIn = clampExpiresIn(params.expiresIn);
        if (!key) return error('Invalid or missing key');

        const cmd = new GetObjectCommand({
          Bucket: env.R2_BUCKET,
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
        const key = scopeKey(params.key, user.id);
        if (!key) return error('Invalid or missing key');

        try {
          const res = await client.send(
            new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
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
        } catch (e: unknown) {
          const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
          if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            return json({ object: null });
          }
          throw e;
        }
      }

      case 'list': {
        const rawPrefix = typeof params.prefix === 'string' ? params.prefix.trim().replace(/^\/+/, '') : '';
        if (rawPrefix.includes('\0') || rawPrefix.split('/').some((seg: string) => seg === '..' || seg === '.')) {
          return error('Invalid prefix');
        }
        const prefix = rawPrefix.startsWith(`${user.id}/`) ? rawPrefix : `${user.id}/${rawPrefix}`;
        const maxKeys =
          typeof params.maxKeys === 'number' && Number.isFinite(params.maxKeys)
            ? Math.min(Math.max(Math.floor(params.maxKeys), 1), 1000)
            : 100;

        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: env.R2_BUCKET,
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
            contentType: '', // not returned by ListObjects
          })),
        });
      }

      case 'delete': {
        const key = scopeKey(params.key, user.id);
        if (!key) return error('Invalid or missing key');

        await client.send(
          new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
        );
        return json({ success: true });
      }

      default:
        return error(`Unknown action: ${String(action)}`);
    }
  } catch (e: unknown) {
    console.error('[r2-presign] error:', e);
    const msg = e instanceof Error ? e.message : 'Internal error';
    return error(msg, 500);
  }
});
