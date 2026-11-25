import { Component, inject } from '@angular/core';
import { OfflineStatusService } from '../core/offline-status.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    @if (status.isOffline()) {
      <div class="offline-banner" role="status" aria-live="polite">
        <span class="offline-banner__dot" aria-hidden="true"></span>
        <span
          >You are offline. Changes are saved locally and will sync when connection returns.</span
        >
      </div>
    }
  `,
  styles: [
    `
      .offline-banner {
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--color-warning-border);
        background: var(--color-warning-tint);
        color: var(--color-warning-text);
        font-size: 0.875rem;
        font-weight: 500;
      }
      .offline-banner__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 9999px;
        background: var(--color-warning-text);
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class OfflineBannerComponent {
  protected readonly status = inject(OfflineStatusService);
}
