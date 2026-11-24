# Cloudflare R2 File Storage — Finance Audit Pro

This document covers the R2 integration for file uploads/downloads in Finance Audit Pro.

## Architecture

```
┌─────────────┐     Presigned URL      ┌─────────────┐
│   Browser   │ ─────────────────────▶ │    R2       │
│  (Angular)  │   Direct PUT/GET       │  (S3 API)   │
└─────────────┘                        └─────────────┘
       ▲                                        ▲
       │         Presigned URL API              │
       │    (Supabase Edge Function or          │
       └─── Next.js /api/r2/[action])           │
            (Server-only, secrets here)
```

**Key principle:** R2 credentials **never** reach the browser. The server generates short-lived presigned URLs (default 1 hour, max 7 days). The browser uploads/downloads directly to R2.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/r2-config.ts` | Load & validate R2 env vars (server-only) |
| `src/lib/r2-client.ts` | Lazy S3 client singleton (server-only) |
| `src/lib/r2-storage.ts` | High-level ops: upload, presign, list, delete, copy |
| `supabase/functions/r2-presign/index.ts` | **Edge Function** for Angular app — deploy to Supabase |
| `src/app/api/r2/[action]/route.ts` | **Next.js API route** for Vercel/Next.js |
| `src/app/core/r2-storage.service.ts` | Angular service calling the presign API |
| `src/app/shared/file-upload-demo.component.ts` | Example upload component with progress |
| `.env.example` | Updated with R2 env vars |

---

## Setup

### 1. Create an R2 Bucket

1. Cloudflare Dashboard → **R2** → **Create bucket**
2. Name it (e.g., `finance-audit-pro-prod`)
3. Note the bucket name

### 2. Create R2 API Token

1. Cloudflare Dashboard → **R2** → **Manage R2 API tokens** → **Create API token**
2. Permissions: **Object Read & Write** (or custom: `PutObject`, `GetObject`, `DeleteObject`, `ListBucket`, `HeadObject`)
3. Save the **Access Key ID** and **Secret Access Key**

### 3. Configure Environment

**For Supabase Edge Functions (current Angular app):**

```bash
supabase secrets set \
  R2_ACCOUNT_ID=your-account-id \
  R2_ACCESS_KEY_ID=your-access-key-id \
  R2_SECRET_ACCESS_KEY=your-secret-access-key \
  R2_BUCKET=your-bucket-name
```

**For Vercel/Next.js (future migration):**

Add to Vercel Project Settings → Environment Variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (optional, for public assets)

**For local development (`.env.local`):**

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Deploy the Edge Function

```bash
supabase functions deploy r2-presign --no-verify-jwt
```

The `--no-verify-jwt` flag allows unauthenticated calls (CORS preflight). In production, you may want to add auth verification inside the function.

### 5. Update Angular Environment

The `r2ApiBaseUrl` in `src/environments/environment.ts` should point to your deployed function:

```typescript
r2ApiBaseUrl: 'https://<project-ref>.supabase.co/functions/v1/r2-presign'
```

---

## Usage

### Angular Component (Direct Upload with Progress)

```typescript
import { R2StorageService } from './core/r2-storage.service';

@Component({...})
export class MyComponent {
  private r2 = inject(R2StorageService);

  async upload(file: File) {
    const { key, etag } = await this.r2.uploadFile(file, 'documents', (p) => {
      console.log(`${p.percent}%`); // progress callback
    });
    // Save `key` to your database record
  }
}
```

### Angular Component (Manual Presigned URL)

```typescript
// 1. Get presigned URL
const { uploadUrl, key, requiredHeaders } = await this.r2.getUploadUrl(
  file.name,
  file.type,
  'documents',
);

// 2. Upload directly (fetch or XMLHttpRequest for progress)
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: requiredHeaders,
});

// 3. Notify your backend that upload completed
await this.http.post('/api/documents', { key, name: file.name }).toPromise();
```

### Server-Side (Node/Next.js/Supabase Function)

```typescript
import { uploadFile, createPresignedUploadUrl, createPresignedDownloadUrl } from '@/lib/r2-storage';

// Direct server upload (webhooks, cron, small files)
await uploadFile({
  key: 'reports/monthly-2026-01.pdf',
  body: pdfBuffer,
  contentType: 'application/pdf',
});

// Generate presigned URL for browser
const { uploadUrl, key, expiresAt, requiredHeaders } = await createPresignedUploadUrl({
  key: 'uploads/abc123-invoice.pdf',
  contentType: 'application/pdf',
  expiresIn: 3600, // 1 hour
});

// Generate presigned download URL (for private files)
const { downloadUrl } = await createPresignedDownloadUrl({
  key: 'uploads/abc123-invoice.pdf',
  expiresIn: 3600,
});
```

---

## API Reference (Edge Function / Next.js Route)

All endpoints: `POST /api/r2/<action>` or `POST /functions/v1/r2-presign`

| Action | Body | Response |
|--------|------|----------|
| `presign-upload` | `{ key, contentType, expiresIn? }` | `{ uploadUrl, key, expiresAt, requiredHeaders }` |
| `presign-download` | `{ key, expiresIn? }` | `{ downloadUrl, key, expiresAt }` |
| `head` | `{ key }` | `{ object: { key, size, etag, lastModified, contentType } \| null }` |
| `list` | `{ prefix?, maxKeys? }` | `{ objects: [{ key, size, etag, lastModified }] }` |
| `delete` | `{ key }` | `{ success: true }` |

---

## Security Notes

- **Presigned URLs expire** (default 1h, max 7d). Rotate them.
- **Validate file types** on the server before issuing presigned URLs.
- **Limit upload size** via `Content-Length` check in your presign API.
- **Scan uploads** (virus, malware) via a webhook or async job after upload.
- **Use folders/prefixes** per user/tenant: `users/{uid}/...` for isolation.
- **Never expose** `R2_SECRET_ACCESS_KEY` to the client.

---

## Migration to Next.js

When migrating to Next.js on Vercel:

1. Copy `src/app/api/r2/[action]/route.ts` to your Next.js project
2. Add R2 env vars to Vercel
3. Update Angular `r2ApiBaseUrl` to `/api/r2` (or call Next.js API directly)
4. The same `r2-storage.ts` server library works unchanged

---

## Testing Locally

```bash
# 1. Start Supabase local dev (includes Edge Functions)
supabase start

# 2. Set local secrets (or use .env.local with supabase functions env)
supabase secrets set --env-file .env.local R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=...

# 3. Deploy function locally
supabase functions deploy r2-presign --no-verify-jwt --project-ref local

# 4. Test with curl
curl -X POST http://localhost:54321/functions/v1/r2-presign \
  -H "Content-Type: application/json" \
  -d '{"action":"presign-upload","key":"test.txt","contentType":"text/plain"}'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Missing secret: R2_ACCOUNT_ID` | Run `supabase secrets set` or add to Vercel env |
| CORS error on upload | Check `Access-Control-Allow-Origin` in Edge Function |
| `SignatureDoesNotMatch` | Verify `Content-Type` header matches presign request |
| `AccessDenied` | Check API token permissions (needs PutObject/GetObject) |
| Upload hangs | Check file size vs. presigned URL expiry; increase `expiresIn` |
| Function timeout | Supabase Edge Functions have 2s CPU limit; presign is fast |

---

## File Structure Ideas

```
finance-audit-pro/
├── customers/
│   └── {customerId}/
│       ├── documents/     # KYC, contracts
│       ├── receipts/      # Payment receipts
│       └── exports/       # Generated PDFs
├── audits/
│   └── {auditId}/
│       ├── evidence/
│       └── reports/
├── uploads/               # Temporary uploads (auto-cleanup)
└── public/                # Public assets (logos, etc.) — if R2_PUBLIC_BASE_URL set
```

Use the `folder` parameter in `R2StorageService` to organize: `uploadFile(file, 'customers/123/documents')`.