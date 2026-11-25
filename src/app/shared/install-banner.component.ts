import { Component, inject } from '@angular/core';
import { InstallPromptService } from '../core/install-prompt.service';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  template: `
    @if (svc.canInstall() && !svc.installed() && !dismissed) {
      <div class="install-banner" role="region" aria-label="Install app">
        <span>Install Weekly Finance on your device for offline access.</span>
        <button type="button" (click)="svc.promptInstall()">Install</button>
        <button type="button" class="dismiss" (click)="dismissed = true" aria-label="Dismiss">
          ×
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 0 0 auto;
      }

      .install-banner {
        position: fixed;
        bottom: max(1rem, env(safe-area-inset-bottom));
        left: 50%;
        z-index: 60;
        display: flex;
        width: min(32rem, calc(100vw - 2rem));
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        transform: translateX(-50%);
        border: 1px solid var(--glass-border-crisp);
        border-radius: var(--glass-radius-md);
        background: var(--glass-surface-elevated);
        box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
        -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate-high));
        backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate-high));
        color: var(--text-primary);
        animation: glassSlideUp 320ms var(--glass-spring-easing) both;
        font-size: 0.8125rem;
      }

      .install-banner span {
        min-width: 0;
        flex: 1 1 auto;
        line-height: 1.45;
      }

      .install-banner button {
        min-height: 2.5rem;
        flex: 0 0 auto;
        padding: 0.5rem 0.875rem;
        border: 1px solid var(--primary-accent);
        border-radius: var(--glass-radius-sm);
        background: var(--primary-accent);
        color: var(--color-on-primary);
        font-weight: 700;
        cursor: pointer;
      }

      .install-banner button:hover {
        border-color: var(--primary-hover);
        background: var(--primary-hover);
      }

      .install-banner .dismiss {
        display: grid;
        width: 2.5rem;
        min-height: 2.5rem;
        padding: 0;
        place-items: center;
        border-color: transparent;
        background: transparent;
        color: var(--text-secondary);
        font-size: 1.25rem;
        line-height: 1;
      }

      .install-banner .dismiss:hover {
        border-color: var(--glass-border-subtle);
        background: var(--color-surface-hover);
        color: var(--text-primary);
      }

      @media (max-width: 767px), (max-height: 680px) {
        .install-banner {
          position: relative;
          bottom: auto;
          left: auto;
          width: calc(100% - 1rem);
          margin: 0.5rem auto;
          transform: none;
        }
      }
    `,
  ],
})
export class InstallBannerComponent {
  protected readonly svc = inject(InstallPromptService);
  dismissed = false;
}
