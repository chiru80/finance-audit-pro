/**
 * Example: File upload component using R2StorageService.
 *
 * Drop this into any Angular component to add file upload with progress.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UploadProgress } from '../core/r2-storage.service';
import { R2StorageService } from '../core/r2-storage.service';

@Component({
  selector: 'app-file-upload-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4 p-4 border rounded-lg">
      <h3 class="font-medium">R2 File Upload Demo</h3>

      <input
        type="file"
        (change)="onFileSelected($event)"
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
      />

      @if (progress()) {
        <div class="space-y-1">
          <div class="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{{ progress()!.percent }}%</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-600 transition-all"
              [style.width.%]="progress()!.percent"
            ></div>
          </div>
        </div>
      }

      @if (result()) {
        <div class="text-sm text-green-600">
          ✅ Uploaded: {{ result()!.key }} (ETag: {{ result()!.etag }})
        </div>
      }

      @if (error()) {
        <div class="text-sm text-red-600">❌ {{ error() }}</div>
      }
    </div>
  `,
})
export class FileUploadDemoComponent {
  private readonly r2 = inject(R2StorageService);

  protected readonly progress = signal<UploadProgress | null>(null);
  protected readonly result = signal<{ key: string; etag: string } | null>(null);
  protected readonly error = signal<string | null>(null);

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);

    try {
      const res = await this.r2.uploadFile(file, 'uploads', (p) => this.progress.set(p));
      this.result.set(res);
    } catch (e: any) {
      this.error.set(e.message ?? 'Upload failed');
    }
  }
}
