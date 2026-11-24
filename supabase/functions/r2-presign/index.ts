/**
 * Supabase Edge Function: R2 Presigned URL Generation
 *
 * Deploy:
 *   supabase functions deploy r2-presign --no-verify-jwt
 *
 * Required secrets (set via `supabase secrets set` or Dashboard):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *
 * Optional:
 *   R2_PUBLIC_BASE_URL  -- if bucket has public read enabled
 *
 * CORS: This function accepts requests from your Vercel/localhost origin.
 * Adjust the `corsHeaders` allow-origin as needed.
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@aws-sdk/client-s3@3.500.0';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from 'https://esm.sh/@aws-sdk/client-s3@3.500.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.500.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // tighten to your domain in production
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
  return env as Env;
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const env = getEnv();
    const client = createR2Client(env);
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'presign-upload': {
        const { key, contentType, expiresIn = 3600 } = params;
        if (!key) return error('Missing key');
        if (!contentType) return error('Missing contentType');

        const cmd = new PutObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: Math.min(expiresIn, 604800) });

        return json({
          uploadUrl,
          key,
          expiresAt: new Date(Date.now() + Math.min(expiresIn, 604800) * 1000).toISOString(),
          requiredHeaders: { 'Content-Type': contentType },
        });
      }

      case 'presign-download': {
        const { key, expiresIn = 3600 } = params;
        if (!key) return error('Missing key');

        const cmd = new GetObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: key,
        });

        const downloadUrl = await getSignedUrl(client, cmd, { expiresIn: Math.min(expiresIn, 604800) });

        return json({
          downloadUrl,
          key,
          expiresAt: new Date(Date.now() + Math.min(expiresIn, 604800) * 1000).toISOString(),
        });
      }

      case 'head': {
        const { key } = params;
        if (!key) return error('Missing key');

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
        } catch (e: any) {
          if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
            return json({ object: null });
          }
          throw e;
        }
      }

      case 'list': {
        const { prefix = '', maxKeys = 100 } = params;
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
        const { key } = params;
        if (!key) return error('Missing key');

        await client.send(
          new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
        );
        return json({ success: true });
      }

      default:
        return error(`Unknown action: ${action}`);
    }
  } catch (e: any) {
    console.error('[r2-presign] error:', e);
    return error(e.message ?? 'Internal error', 500);
  }
});