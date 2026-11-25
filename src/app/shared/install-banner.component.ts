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
        <button type="button" class="dismiss" (click)="dismissed = true" aria-label="Dismiss">×</button>
      </div>
    }
  `,
  styles: [`
    .install-banner {
      position: fixed;
      bottom: max(1rem, env(safe-area-inset-bottom));
      left: 50%;
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: min(38rem, calc(100vw - 2rem));
      padding: 0.625rem 0.75rem 0.625rem 1rem;
      transform: translateX(-50%);
      border: 1px solid var(--glass-border-crisp);
      border-radius: 14px;
      background: var(--luxury-gradient-surface), var(--bg-sidebar);
      color: var(--text-primary);
      box-shadow: var(--glass-shadow-lg);
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .install-banner > span {
      flex: 1 1 auto;
      min-width: 0;
    }
    .install-banner button {
      flex-shrink: 0;
      min-height: 2.5rem;
      padding: 0.375rem 0.875rem;
      border: 0;
      border-radius: 9px;
      background: var(--luxury-gradient-accent);
      color: var(--color-on-primary);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--glass-transition-fast), box-shadow var(--glass-transition-fast);
    }
    .install-banner button:hover {
      transform: translateY(-1px);
      box-shadow: var(--glass-shadow-sm);
    }
    .install-banner .dismiss {
      min-width: 2.5rem;
      min-height: 2.5rem;
      padding: 0.25rem;
      background: transparent;
      color: var(--text-secondary);
      font-size: 1.25rem;
      line-height: 1;
    }
    @media (max-width: 480px) {
      .install-banner {
        gap: 0.5rem;
        padding-inline: 0.75rem 0.5rem;
        font-size: 0.75rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .install-banner button {
        transition: none;
      }
    }
  `],
})
export class InstallBannerComponent {
  protected readonly svc = inject(InstallPromptService);
  dismissed = false;
}
