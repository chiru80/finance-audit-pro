import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassButtonComponent } from './glass-button.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type GlassEmptyStateSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'glass-empty-state',
  standalone: true,
  imports: [CommonModule, GlassButtonComponent],
  template: `
    <div
      class="glass-empty-root"
      [ngClass]="[sizeClasses, variantClasses]"
    >
      <!-- Specular Highlight -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div class="glass-empty-content">
        <!-- Icon -->
        <div class="glass-empty-icon" [innerHTML]="safeIcon"></div>

        <!-- Title -->
        <h3 class="glass-empty-title">{{ title }}</h3>

        <!-- Description -->
        @if (description) {
          <p class="glass-empty-description">{{ description }}</p>
        }

        <!-- Action Button -->
        @if (actionLabel && actionLabel.length > 0) {
          <div class="glass-empty-action">
            <glass-button
              [variant]="actionVariant"
              [size]="size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'"
              (onClick)="action.emit($event)"
            >
              {{ actionLabel }}
            </glass-button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .glass-empty-root {
      position: relative;
      background: #151F32;
      border: 1px solid #263449;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
    }

    .glass-empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .glass-empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      margin-bottom: 0.5rem;
    }

    .glass-empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: #F8FAFC;
      margin: 0;
    }

    .glass-empty-description {
      font-size: 0.875rem;
      color: #94A3B8;
      max-width: 320px;
      margin: 0;
      line-height: 1.5;
    }

    .glass-empty-action {
      margin-top: 0.5rem;
    }

    /* Size Variants */
    .size-sm {
      padding: 1.5rem;
    }

    .size-sm .glass-empty-icon {
      width: 48px;
      height: 48px;
    }

    .size-sm .glass-empty-title {
      font-size: 0.875rem;
    }

    .size-lg {
      padding: 3rem;
    }

    .size-lg .glass-empty-icon {
      width: 80px;
      height: 80px;
    }

    .size-lg .glass-empty-title {
      font-size: 1.25rem;
    }

    /* Variant Classes */
    .variant-default .glass-empty-icon {
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(37, 99, 235, 0.30);
      color: #38BDF8;
    }

    .variant-success .glass-empty-icon {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.30);
      color: #34D399;
    }

    .variant-warning .glass-empty-icon {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.30);
      color: #FBBF24;
    }

    .variant-danger .glass-empty-icon {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.30);
      color: #F87171;
    }

    .variant-info .glass-empty-icon {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.30);
      color: #60A5FA;
    }
  `],
})
export class GlassEmptyStateComponent {
  @Input() title = 'No data available';
  @Input() description = '';
  @Input() icon: string = '';
  @Input() variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() size: GlassEmptyStateSize = 'md';
  @Input() actionLabel = '';
  @Input() actionVariant: 'filled' | 'glass' | 'tinted' | 'danger' = 'filled';

  @Output() action = new EventEmitter<MouseEvent>();

  private sanitizer = inject(DomSanitizer);

  get sizeClasses(): string {
    return `size-${this.size}`;
  }

  get variantClasses(): string {
    return `variant-${this.variant}`;
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) {
      const defaultIcons: Record<string, string> = {
        default: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
        danger: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />',
        info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
      };
      const svgPath = defaultIcons[this.variant] || defaultIcons['default'];
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke="currentColor">${svgPath}</svg>`
      );
    }
    const svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }
}