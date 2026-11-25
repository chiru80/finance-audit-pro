import { Component, inject } from '@angular/core';
import { InstallPromptService } from '../core/install-prompt.service';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  template: `
    @if (svc.canInstall() && !svc.installed() && !dismissed) {
      <div class="install-banner" role="region" aria-label="Install app">
        <span>Install Finance Audit Pro on your device for offline access.</span>
        <button type="button" (click)="svc.promptInstall()">Install</button>
        <button type="button" class="dismiss" (click)="dismissed = true" aria-label="Dismiss">
          ×
        </button>
      </div>
    }
  `,
  styles: [
    `
      .install-banner {
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 60;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 1rem;
        background: var(--bg-sidebar, #0f172a);
        color: #fff;
        border: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.12));
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        font-size: 0.875rem;
      }
      .install-banner button {
        background: var(--primary-accent, #2563eb);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.375rem 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }
      .install-banner .dismiss {
        background: transparent;
        padding: 0.25rem 0.5rem;
        font-size: 1.25rem;
        line-height: 1;
      }
    `,
  ],
})
export class InstallBannerComponent {
  protected readonly svc = inject(InstallPromptService);
  dismissed = false;
}
