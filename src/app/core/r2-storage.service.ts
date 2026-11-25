/**
 * Angular service for R2 file storage via presigned URLs.
 *
 * Usage:
 *   1. Call getUploadUrl(file.name, file.type) → { uploadUrl, key, expiresAt }
 *   2. PUT the file directly to uploadUrl from the browser
 *   3. (Optional) Notify your backend that upload completed
 *
 * The actual presigned URL generation happens on the server (Edge Function / API route)
 * to keep R2 secrets off the client.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../supabase.service';

export interface R2UploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresAt: string; // ISO timestamp
  requiredHeaders: Record<string, string>;
}

export interface R2DownloadUrlResponse {
  downloadUrl: string;
  key: string;
  expiresAt: string;
}

export interface R2ObjectInfo {
  key: string;
  size: number;
  etag: string;
  lastModified: string;
  contentType: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

@Injectable({ providedIn: 'root' })
export class R2StorageService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly baseUrl = environment.r2ApiBaseUrl;

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const {
      data: { session },
    } = await this.supabase.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error('Authentication required for storage operations');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /** Request a presigned PUT URL for uploading a file. */
  async getUploadUrl(
    fileName: string,
    contentType: string,
    folder?: string,
  ): Promise<R2UploadUrlResponse> {
    const key = this.buildKey(fileName, folder);
    const headers = await this.getAuthHeaders();
    const res = await firstValueFrom(
      this.http.post<R2UploadUrlResponse>(
        `${this.baseUrl}/presign-upload`,
        {
          action: 'presign-upload',
          key,
          contentType,
        },
        { headers },
      ),
    );
    return res;
  }

  /** Request a presigned GET URL for downloading a private file. */
  async getDownloadUrl(key: string): Promise<R2DownloadUrlResponse> {
    const headers = await this.getAuthHeaders();
    const res = await firstValueFrom(
      this.http.post<R2DownloadUrlResponse>(
        `${this.baseUrl}/presign-download`,
        {
          action: 'presign-download',
          key,
        },
        { headers },
      ),
    );
    return res;
  }

  /** Get metadata for an object (server-side check). */
  async getObjectInfo(key: string): Promise<R2ObjectInfo | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await firstValueFrom(
        this.http.post<{ object: R2ObjectInfo | null }>(
          `${this.baseUrl}/head`,
          { action: 'head', key },
          { headers },
        ),
      );
      return res.object;
    } catch {
      return null;
    }
  }

  /** List objects under a prefix. */
  async listObjects(prefix: string, maxKeys = 100): Promise<R2ObjectInfo[]> {
    const headers = await this.getAuthHeaders();
    const res = await firstValueFrom(
      this.http.post<{ objects: R2ObjectInfo[] }>(
        `${this.baseUrl}/list`,
        {
          action: 'list',
          prefix,
          maxKeys,
        },
        { headers },
      ),
    );
    return res.objects;
  }

  /** Delete an object. */
  async deleteObject(key: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/delete`, { action: 'delete', key }, { headers }),
    );
  }

  /**
   * Upload a file directly from the browser to R2 using a presigned URL.
   * Returns an Observable for progress tracking.
   */
  async uploadFile(
    file: File,
    folder?: string,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<{ key: string; etag: string }> {
    // 1. Get presigned URL
    const { uploadUrl, key, requiredHeaders } = await this.getUploadUrl(
      file.name,
      file.type,
      folder,
    );

    // 2. Upload directly to R2
    await this.putToPresignedUrl(uploadUrl, file, requiredHeaders, onProgress);

    // 3. Verify (optional - can call headObject)
    return { key, etag: '' }; // etag would come from response headers
  }

  /** Low-level PUT to a presigned URL with progress. */
  private async putToPresignedUrl(
    url: string,
    file: File,
    requiredHeaders: Record<string, string>,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('PUT', url);
      Object.entries(requiredHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.send(file);
    });
  }

  /** Build a storage key: folder/uuid-filename */
  private buildKey(fileName: string, folder?: string): string {
    const uuid = crypto.randomUUID();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/` : '';
    return `${prefix}${uuid}-${safeName}`;
  }
}
