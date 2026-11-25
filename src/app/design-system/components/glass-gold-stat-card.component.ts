import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

export type GlassGoldStatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'fx-gold-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fx-gold-stat-root" [ngClass]="surfaceClasses">
      <!-- Gold gradient top bar -->
      <div class="fx-gold-accent-bar"></div>

      <div class="fx-gold-stat-content">
        <!-- Icon Circle -->
        @if (icon) {
          <div
            class="fx-gold-icon-circle"
            [ngClass]="iconColorClasses"
            [innerHTML]="safeIcon"
          ></div>
        }

        <!-- Main Content -->
        <div class="fx-gold-stat-main">
          <!-- Label -->
          <p class="fx-gold-label">{{ label }}</p>

          <!-- Value -->
          <h3 class="fx-gold-value">{{ formattedValue }}</h3>

          <!-- Sub-value / Prefix info -->
          @if (subValue) {
            <p class="fx-gold-sub-value">{{ subValue }}</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .fx-gold-stat-root {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--glass-border-subtle);
        border-radius: 16px;
        background: var(--glass-surface-base);
        box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
        -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
        backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
        animation: glassSlideUp 420ms var(--glass-spring-easing) both;
        transition:
          transform var(--glass-transition-normal),
          box-shadow var(--glass-transition-normal),
          border-color var(--glass-transition-normal);
      }

      .fx-gold-stat-root:hover {
        transform: translateY(-2px) scale(1.008);
        border-color: var(--glass-border-crisp);
        box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
      }

      :host:nth-child(2) .fx-gold-stat-root { animation-delay: 45ms; }
      :host:nth-child(3) .fx-gold-stat-root { animation-delay: 90ms; }
      :host:nth-child(4) .fx-gold-stat-root { animation-delay: 135ms; }
      :host:nth-child(5) .fx-gold-stat-root { animation-delay: 180ms; }
      :host:nth-child(6) .fx-gold-stat-root { animation-delay: 225ms; }

      .fx-gold-accent-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-accent), transparent 76%);
        border-radius: 16px 16px 0 0;
      }

      .fx-gold-stat-content {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        padding: 1.25rem;
      }

      .fx-gold-icon-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 11px;
        background: var(--gold-icon-bg, var(--color-primary-tint));
        border: 1px solid var(--gold-icon-border, var(--color-primary-border));
        color: var(--gold-icon-text, var(--color-primary-text));
        stroke: currentColor;
        transition: transform 150ms ease;
      }

      .fx-gold-icon-circle svg {
        width: 20px;
        height: 20px;
      }

      .fx-gold-stat-root:hover .fx-gold-icon-circle {
        transform: scale(1.08);
      }

      /* Color variants */
      .fx-color-primary {
        --gold-icon-bg: var(--color-primary-tint);
        --gold-icon-border: var(--color-primary-border);
        --gold-icon-text: var(--color-primary-text);
      }

      .fx-color-success {
        --gold-icon-bg: var(--color-success-tint);
        --gold-icon-border: var(--color-success-border);
        --gold-icon-text: var(--color-success-text);
      }

      .fx-color-warning {
        --gold-icon-bg: var(--color-warning-tint);
        --gold-icon-border: var(--color-warning-border);
        --gold-icon-text: var(--color-warning-text);
      }

      .fx-color-danger {
        --gold-icon-bg: var(--color-danger-tint);
        --gold-icon-border: var(--color-danger-border);
        --gold-icon-text: var(--color-danger-text);
      }

      .fx-color-info {
        --gold-icon-bg: var(--color-info-tint);
        --gold-icon-border: var(--color-info-border);
        --gold-icon-text: var(--color-info-text);
      }

      .fx-gold-stat-main {
        flex: 1;
        min-width: 0;
      }

      .fx-gold-label {
        margin: 0 0 0.25rem 0;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .fx-gold-value {
        margin: 0;
        font-size: clamp(1.25rem, 1.8vw, 1.7rem);
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.045em;
        font-variant-numeric: tabular-nums;
        color: var(--text-primary);
        word-break: break-word;
      }

      .fx-gold-sub-value {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 0.02em;
      }

      @media (prefers-reduced-motion: reduce) {
        .fx-gold-stat-root {
          transition: none;
        }
        .fx-gold-icon-circle {
          transition: none;
        }
        .fx-gold-stat-root:hover {
          transform: none;
          box-shadow: 0 4px 20px -8px rgba(0, 0, 0, 0.08);
        }
      }
    `,
  ],
})
export class GlassGoldStatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() icon?: string;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() subValue = '';
  @Input() color: GlassGoldStatCardColor = 'primary';
  @Input() trend?: number;

  private sanitizer = inject(DomSanitizer);

  get surfaceClasses(): string {
    return `fx-color-${this.color}`;
  }

  get iconColorClasses(): string {
    return `fx-color-${this.color}`;
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) return '';
    const svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`,
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  get formattedValue(): string {
    const prefix = this.prefix;
    const suffix = this.suffix;

    if (typeof this.value === 'number') {
      if (this.value >= 10000000) {
        return `${prefix}${(this.value / 10000000).toFixed(1)}Cr${suffix}`;
      }
      if (this.value >= 100000) {
        return `${prefix}${(this.value / 100000).toFixed(1)}L${suffix}`;
      }
      if (this.value >= 1000) {
        return `${prefix}${(this.value / 1000).toFixed(1)}K${suffix}`;
      }
      return `${prefix}${this.value}${suffix}`;
    }
    return `${prefix}${this.value}${suffix}`;
  }
}
