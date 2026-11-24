import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { GlassProgressComponent } from './glass-progress.component';

export type GlassStatCardVariant = 'default' | 'elevated' | 'subtle' | 'kpi';
export type GlassStatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'glass-stat-card',
  standalone: true,
  imports: [CommonModule, GlassProgressComponent],
  template: `
    <div class="glass-stat-root" [ngClass]="[surfaceClasses, colorClasses, interactiveClasses]">
      <!-- Specular Highlight (uses design token --glass-specular-top) -->
      <div class="glass-specular-top pointer-events-none absolute inset-x-0 top-0 h-[1px]"></div>

      <!-- Glow Accent (for glow variant) -->
      <!-- Removed: glow variant deprecated per design system - no decorative effects -->

      <div class="glass-stat-content">
        <!-- Icon -->
        @if (icon) {
          <div class="glass-stat-icon" [ngClass]="iconColorClasses" [innerHTML]="safeIcon"></div>
        }

        <!-- Main Content -->
        <div class="glass-stat-main">
          <!-- Label & Trend -->
          <div class="glass-stat-header">
            <p class="glass-stat-label">{{ label }}</p>
            @if (trend !== undefined) {
              <span
                class="glass-stat-trend"
                [class.positive]="trend >= 0"
                [class.negative]="trend < 0"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    [attr.d]="trend >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                  />
                </svg>
                {{ trend >= 0 ? '+' : '' }}{{ trend }}%
              </span>
            }
          </div>

          <!-- Value -->
          <h3 class="glass-stat-value" [innerHTML]="formattedValueHtml"></h3>

          <!-- Sub-value / Prefix/Suffix info -->
          @if (subValue) {
            <p class="glass-stat-sub-value">{{ subValue }}</p>
          }

          <!-- Progress Bar (optional) -->
          @if (progressValue !== undefined) {
            <div class="glass-stat-progress">
              <glass-progress
                [value]="progressValue"
                [variant]="progressVariant"
                [showLabel]="false"
              />
            </div>
          }
        </div>
      </div>

      <!-- Footer Badge / Status -->
      @if (footerBadge) {
        <div class="glass-stat-footer">
          <span class="glass-stat-badge" [ngClass]="footerBadgeClasses">
            {{ footerBadge }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .glass-stat-root {
        position: relative;
        padding: 1.5rem;
        border-radius: 16px;
        overflow: hidden;
        background: var(--stat-surface-bg, var(--glass-surface-base));
        border: 1px solid var(--stat-surface-border, var(--glass-border-subtle));
        box-shadow: var(--stat-surface-shadow, var(--glass-shadow-md)), var(--glass-specular-rim);
        backdrop-filter: blur(var(--stat-blur, var(--glass-blur-md)))
          saturate(var(--glass-saturate));
        -webkit-backdrop-filter: blur(var(--stat-blur, var(--glass-blur-md)))
          saturate(var(--glass-saturate));
        transition:
          transform var(--glass-transition-normal),
          border-color var(--glass-transition-normal),
          box-shadow var(--glass-transition-normal);
      }

      .surface-default,
      .surface-kpi,
      .surface-glow {
        --stat-surface-bg: var(--glass-surface-base);
        --stat-surface-border: var(--glass-border-subtle);
        --stat-surface-shadow: var(--glass-shadow-md);
        --stat-blur: var(--glass-blur-md);
      }

      .surface-elevated {
        --stat-surface-bg: var(--glass-surface-elevated);
        --stat-surface-border: var(--glass-border-crisp);
        --stat-surface-shadow: var(--glass-shadow-md);
        --stat-blur: var(--glass-blur-lg);
      }

      .surface-subtle {
        --stat-surface-bg: var(--glass-surface-muted);
        --stat-surface-border: var(--glass-border-subtle);
        --stat-surface-shadow: var(--glass-shadow-sm);
        --stat-blur: var(--glass-blur-sm);
      }

      .glass-stat-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .glass-stat-main {
        flex: 1;
        min-width: 0;
      }

      .glass-stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border-radius: 10px;
        background: var(--stat-accent-bg, var(--color-surface-hover));
        border: 1px solid var(--stat-accent-border, var(--glass-border-subtle));
        color: var(--stat-accent-text, var(--text-muted));
        stroke: currentColor;
        transition: transform var(--glass-transition-fast);
      }

      .glass-stat-icon svg {
        width: 19px;
        height: 19px;
      }

      .glass-stat-root:hover .glass-stat-icon {
        transform: scale(1.05);
      }

      .color-primary {
        --stat-accent-bg: var(--color-primary-tint);
        --stat-accent-border: var(--color-primary-border);
        --stat-accent-text: var(--color-primary-text);
        --stat-hover-glow: var(--glass-shadow-glow-accent);
      }

      .color-success {
        --stat-accent-bg: var(--color-success-tint);
        --stat-accent-border: var(--color-success-border);
        --stat-accent-text: var(--color-success-text);
        --stat-hover-glow: var(--glass-shadow-glow-success);
      }

      .color-warning {
        --stat-accent-bg: var(--color-warning-tint);
        --stat-accent-border: var(--color-warning-border);
        --stat-accent-text: var(--color-warning-text);
        --stat-hover-glow: var(--glass-shadow-glow-warning);
      }

      .color-danger {
        --stat-accent-bg: var(--color-danger-tint);
        --stat-accent-border: var(--color-danger-border);
        --stat-accent-text: var(--color-danger-text);
        --stat-hover-glow: var(--glass-shadow-glow-danger);
      }

      .color-info {
        --stat-accent-bg: var(--color-info-tint);
        --stat-accent-border: var(--color-info-border);
        --stat-accent-text: var(--color-info-text);
        --stat-hover-glow: var(--glass-shadow-glow-info);
      }

      .color-neutral {
        --stat-accent-bg: var(--color-surface-hover);
        --stat-accent-border: var(--border-color);
        --stat-accent-text: var(--text-muted);
        --stat-hover-border: var(--glass-border-crisp);
        --stat-hover-glow: 0 0 0 0 transparent;
      }

      .glass-stat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .glass-stat-label {
        margin: 0;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        white-space: nowrap;
      }

      .glass-stat-trend {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .glass-stat-trend.positive {
        background: var(--color-success-tint);
        color: var(--color-success-text);
        border: 1px solid var(--color-success-border);
      }

      .glass-stat-trend.negative {
        background: var(--color-danger-tint);
        color: var(--color-danger-text);
        border: 1px solid var(--color-danger-border);
      }

      .glass-stat-value {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums;
        color: var(--text-primary);
        word-break: break-word;
      }

      .glass-stat-sub-value {
        margin: 0.25rem 0 0;
        font-size: var(--glass-text-xs);
        font-weight: 500;
        color: var(--text-muted);
      }

      .glass-stat-progress {
        margin-top: 0.75rem;
      }

      .glass-stat-footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--glass-border-subtle);
      }

      .glass-stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        border: 1px solid var(--stat-badge-border);
        border-radius: 9999px;
        background: var(--stat-badge-bg);
        color: var(--stat-badge-text);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badge-primary {
        --stat-badge-bg: var(--color-primary-tint);
        --stat-badge-border: var(--color-primary-border);
        --stat-badge-text: var(--color-primary-text);
      }
      .badge-success {
        --stat-badge-bg: var(--color-success-tint);
        --stat-badge-border: var(--color-success-border);
        --stat-badge-text: var(--color-success-text);
      }
      .badge-warning {
        --stat-badge-bg: var(--color-warning-tint);
        --stat-badge-border: var(--color-warning-border);
        --stat-badge-text: var(--color-warning-text);
      }
      .badge-danger {
        --stat-badge-bg: var(--color-danger-tint);
        --stat-badge-border: var(--color-danger-border);
        --stat-badge-text: var(--color-danger-text);
      }
      .badge-info {
        --stat-badge-bg: var(--color-info-tint);
        --stat-badge-border: var(--color-info-border);
        --stat-badge-text: var(--color-info-text);
      }
      .badge-neutral {
        --stat-badge-bg: var(--color-neutral-tint);
        --stat-badge-border: var(--color-neutral-border);
        --stat-badge-text: var(--color-neutral-text);
      }

      .interactive-true {
        cursor: pointer;
      }

      .interactive-true:hover {
        transform: translateY(-2px);
        border-color: var(
          --stat-hover-border,
          var(--stat-accent-border, var(--glass-border-crisp))
        );
        box-shadow: var(--glass-shadow-md), var(--stat-hover-glow, 0 0 0 0 transparent);
      }
    `,
  ],
})
export class GlassStatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trend?: number;
  @Input() icon?: string;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() subValue = '';
  @Input() color: GlassStatCardColor = 'primary';
  @Input() variant: GlassStatCardVariant = 'default';
  @Input() interactive = false;
  @Input() progressValue?: number;
  @Input() progressVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() footerBadge = '';
  @Input() footerBadgeColor: GlassStatCardColor = 'primary';

  private sanitizer = inject(DomSanitizer);

  get surfaceClasses(): string {
    return `surface-${this.variant}`;
  }

  get colorClasses(): string {
    return `color-${this.color}`;
  }

  get interactiveClasses(): string {
    return this.interactive ? 'interactive-true' : 'interactive-false';
  }

  get iconColorClasses(): string {
    return `color-${this.color}`;
  }

  get footerBadgeClasses(): string {
    return `badge-${this.footerBadgeColor}`;
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) return '';
    const svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`,
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
