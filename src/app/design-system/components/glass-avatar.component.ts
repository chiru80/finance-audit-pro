import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

export type GlassAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type GlassAvatarShape = 'circle' | 'square' | 'rounded';

@Component({
  selector: 'glass-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="glass-avatar-root"
      [ngClass]="[sizeClasses, shapeClasses, variantClasses, interactiveClasses]"
      [title]="name || ''"
    >
      @if (src) {
        <img [src]="src" [alt]="name || 'Avatar'" class="glass-avatar-image" />
      } @else if (icon) {
        <div class="glass-avatar-icon" [innerHTML]="safeIcon"></div>
      } @else {
        <div class="glass-avatar-initials" [ngClass]="colorClasses">
          {{ getInitials(name) }}
        </div>
      }

      @if (status) {
        <span class="glass-avatar-status" [ngClass]="statusClasses"></span>
      }

      @if (badge) {
        <span class="glass-avatar-badge" [ngClass]="badgeColorClasses">
          {{ badge }}
        </span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .glass-avatar-root {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--avatar-size, 40px);
        height: var(--avatar-size, 40px);
        overflow: hidden;
        border: 1px solid var(--avatar-border, var(--glass-border-subtle));
        border-radius: var(--avatar-radius, 50%);
        background: var(--avatar-bg, var(--glass-surface-base));
        box-shadow: var(--glass-shadow-sm);
        font-size: var(--avatar-font, 0.875rem);
        transition:
          transform var(--glass-transition-normal),
          box-shadow var(--glass-transition-normal);
      }

      .glass-avatar-root:hover {
        transform: scale(1.02);
        box-shadow: var(--glass-shadow-md);
      }

      .glass-avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .glass-avatar-icon,
      .glass-avatar-initials {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
      }

      .glass-avatar-icon {
        color: var(--color-info-text);
      }

      .glass-avatar-initials {
        background: var(--avatar-initial-bg, var(--color-neutral-tint));
        color: var(--avatar-initial-ink, var(--color-neutral-text));
        font-weight: 700;
        text-transform: uppercase;
      }

      .glass-avatar-status {
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: var(--avatar-status-size, 12px);
        height: var(--avatar-status-size, 12px);
        border: 2px solid var(--bg-primary);
        border-radius: var(--avatar-status-radius, 50%);
      }

      .glass-avatar-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        display: flex;
        min-width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        border: 2px solid var(--bg-primary);
        border-radius: 9999px;
        background: var(--avatar-badge-bg, var(--color-danger-text));
        color: var(--text-primary);
        font-size: 0.625rem;
        font-weight: 700;
      }

      .size-xs {
        --avatar-size: 24px;
        --avatar-font: 0.625rem;
        --avatar-status-size: 8px;
      }
      .size-sm {
        --avatar-size: 32px;
        --avatar-font: 0.75rem;
        --avatar-status-size: 10px;
      }
      .size-md {
        --avatar-size: 40px;
        --avatar-font: 0.875rem;
        --avatar-status-size: 12px;
      }
      .size-lg {
        --avatar-size: 48px;
        --avatar-font: 1rem;
        --avatar-status-size: 14px;
      }
      .size-xl {
        --avatar-size: 64px;
        --avatar-font: 1.25rem;
        --avatar-status-size: 16px;
      }
      .size-2xl {
        --avatar-size: 80px;
        --avatar-font: 1.5rem;
        --avatar-status-size: 20px;
      }

      .shape-circle {
        --avatar-radius: 50%;
      }
      .shape-square {
        --avatar-radius: 4px;
        --avatar-status-radius: 4px;
      }
      .shape-rounded {
        --avatar-radius: 12px;
        --avatar-status-radius: 12px;
      }

      .variant-default,
      .variant-ring {
        --avatar-bg: var(--glass-surface-muted);
        --avatar-border: var(--glass-border-subtle);
      }

      .variant-gradient,
      .variant-gradient-blue,
      .variant-gradient-emerald {
        --avatar-bg: var(--color-primary-tint);
        --avatar-border: var(--color-primary-border);
      }

      .variant-gradient-purple,
      .variant-gradient-amber,
      .variant-gradient-rose {
        --avatar-bg: var(--color-neutral-tint);
        --avatar-border: var(--color-neutral-border);
      }

      .color-blue,
      .color-emerald,
      .color-green,
      .color-teal {
        --avatar-initial-bg: var(--color-primary-tint);
        --avatar-initial-ink: var(--color-primary-text);
      }

      .color-indigo,
      .color-purple,
      .color-sky,
      .color-cyan {
        --avatar-initial-bg: var(--color-info-tint);
        --avatar-initial-ink: var(--color-info-text);
      }

      .color-pink,
      .color-red,
      .color-rose {
        --avatar-initial-bg: var(--color-danger-tint);
        --avatar-initial-ink: var(--color-danger-text);
      }

      .color-orange,
      .color-amber,
      .color-yellow {
        --avatar-initial-bg: var(--color-warning-tint);
        --avatar-initial-ink: var(--color-warning-text);
      }

      .status-online {
        background: var(--color-success-text);
      }
      .status-offline {
        background: var(--text-muted);
      }
      .status-busy {
        background: var(--color-danger-text);
      }
      .status-away {
        background: var(--color-warning-text);
      }
      .status-dnd {
        background: var(--color-info-text);
      }

      .badge-default,
      .badge-primary {
        --avatar-badge-bg: var(--primary-accent);
      }
      .badge-success {
        --avatar-badge-bg: var(--color-success-text);
      }
      .badge-warning {
        --avatar-badge-bg: var(--color-warning-text);
      }
      .badge-danger {
        --avatar-badge-bg: var(--color-danger-text);
      }
      .badge-info {
        --avatar-badge-bg: var(--color-info-text);
      }

      .interactive-true {
        cursor: pointer;
      }

      .interactive-true:hover {
        transform: scale(1.05);
      }
    `,
  ],
})
export class GlassAvatarComponent {
  @Input() src = '';
  @Input() name = '';
  @Input() icon = '';
  @Input() size: GlassAvatarSize = 'md';
  @Input() shape: GlassAvatarShape = 'circle';
  @Input() variant:
    | 'default'
    | 'gradient'
    | 'gradient-blue'
    | 'gradient-purple'
    | 'gradient-emerald'
    | 'gradient-amber'
    | 'gradient-rose'
    | 'ring' = 'default';
  @Input() color: string = 'blue';
  @Input() status: 'online' | 'offline' | 'busy' | 'away' | 'dnd' | '' = '';
  @Input() badge = '';
  @Input() badgeColor: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' =
    'default';
  @Input() interactive = false;

  private sanitizer = inject(DomSanitizer);

  get sizeClasses(): string {
    return `size-${this.size}`;
  }

  get shapeClasses(): string {
    return `shape-${this.shape}`;
  }

  get variantClasses(): string {
    return `variant-${this.variant}`;
  }

  get colorClasses(): string {
    return `color-${this.color}`;
  }

  get statusClasses(): string {
    return `status-${this.status}`;
  }

  get badgeColorClasses(): string {
    return `badge-${this.badgeColor}`;
  }

  get interactiveClasses(): string {
    return this.interactive ? 'interactive-true' : 'interactive-false';
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) return '';
    const svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`,
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
