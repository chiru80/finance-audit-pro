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
          <h3 class="fx-gold-value" [innerHTML]="formattedValueHtml"></h3>

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
        background: linear-gradient(135deg, #fffbeb 0%, #feece8 100%);
        border: 1px solid #e5d8c9;
        border-radius: 16px;
        overflow: hidden;
        box-shadow:
          0 4px 20px -8px rgba(0, 0, 0, 0.08),
          0 1px 3px 0 rgba(0, 0, 0, 0.05);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition:
          transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 300ms cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
      }

      .fx-gold-stat-root:hover {
        transform: translateY(-4px);
        box-shadow:
          0 8px 32px -8px rgba(0, 0, 0, 0.12),
          0 4px 12px 0 rgba(0, 0, 0, 0.08),
          0 1px 3px 0 rgba(0, 0, 0, 0.05);
      }

      .fx-gold-accent-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #d4af37 0%, #b58a2f 100%);
        border-radius: 0 0 16px 16px;
      }

      .fx-gold-stat-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem;
      }

      .fx-gold-icon-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex-shrink: 0;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--gold-icon-bg, #fff7ed) 0%, #feece8 100%);
        border: 1px solid var(--gold-icon-border, #fcd7ba);
        color: var(--gold-icon-text, #92400e);
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
        --gold-icon-bg: #fff7ed;
        --gold-icon-border: #fcd7ba;
        --gold-icon-text: #92400e;
      }

      .fx-color-success {
        --gold-icon-bg: #f0fdf4;
        --gold-icon-border: #bbf7d0;
        --gold-icon-text: #166534;
      }

      .fx-color-warning {
        --gold-icon-bg: #fffbeb;
        --gold-icon-border: #fde68a;
        --gold-icon-text: #92400e;
      }

      .fx-color-danger {
        --gold-icon-bg: #fef2f2;
        --gold-icon-border: #fecaca;
        --gold-icon-text: #991b1b;
      }

      .fx-color-info {
        --gold-icon-bg: #f0f9ff;
        --gold-icon-border: #bfdbfe;
        --gold-icon-text: #0c4a6e;
      }

      .fx-gold-stat-main {
        flex: 1;
        min-width: 0;
      }

      .fx-gold-label {
        margin: 0 0 0.25rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #718096;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .fx-gold-value {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
        color: #111827;
        word-break: break-word;
      }

      .fx-gold-sub-value {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        font-weight: 500;
        color: #92400e;
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

  get formattedValueHtml(): string {
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
