import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GlassProgressComponent } from './glass-progress.component';

export type GlassStatCardVariant = 'default' | 'elevated' | 'subtle' | 'kpi' | 'glow';
export type GlassStatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'glass-stat-card',
  standalone: true,
  imports: [CommonModule, GlassProgressComponent],
  template: `
    <div
      class="glass-stat-root"
      [ngClass]="[surfaceClasses, colorClasses, interactiveClasses]"
    >
      <!-- Specular Highlight (uses design token --glass-specular-top) -->
      <div class="glass-specular-top pointer-events-none absolute inset-x-0 top-0 h-[1px]"></div>

      <!-- Glow Accent (for glow variant) -->
      @if (variant === 'glow' && glowColor) {
        <div
          class="glass-stat-glow"
          [style.background]="glowColor"
        ></div>
      }

      <div class="glass-stat-content" [innerHTML]="iconHtml">
        <!-- Icon -->
        @if (icon) {
          <div
            class="glass-stat-icon"
            [ngClass]="iconColorClasses"
            [innerHTML]="safeIcon"
          ></div>
        }

        <!-- Main Content -->
        <div class="glass-stat-main">
          <!-- Label & Trend -->
          <div class="glass-stat-header">
            <p class="glass-stat-label">{{ label }}</p>
            @if (trend !== undefined) {
              <span class="glass-stat-trend" [class.positive]="trend >= 0" [class.negative]="trend < 0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        [attr.d]="trend >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'" />
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
  styles: [`
    :host {
      display: block;
    }

    .glass-stat-root {
      position: relative;
      padding: 1.5rem;
      border-radius: 16px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    .glass-stat-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    /* Icon */
    .glass-stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
      transition: transform 0.2s ease;
      stroke: currentColor;
    }

    .glass-stat-root:hover .glass-stat-icon {
      transform: scale(1.05);
    }

    /* Main Content */
    .glass-stat-main {
      flex: 1;
      min-width: 0;
    }

    .glass-stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .glass-stat-label {
      font-size: var(--glass-text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 0;
      white-space: nowrap;
    }

    .glass-stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .glass-stat-trend.positive {
      background: var(--color-success-light);
      color: var(--color-success-light);
      border: 1px solid var(--color-success-border);
    }

    .glass-stat-trend.negative {
      background: var(--color-danger-light);
      color: var(--color-danger-light);
      border: 1px solid var(--color-danger-border);
    }

    .glass-stat-value {
      font-size: var(--glass-text-2xl);
      font-weight: 800;
      line-height: 1.1;
      color: var(--text-primary);
      margin: 0;
      word-break: break-word;
    }

    .glass-stat-sub-value {
      font-size: var(--glass-text-xs);
      font-weight: 500;
      color: var(--text-muted);
      margin: 0.25rem 0 0 0;
    }

    .glass-stat-progress {
      margin-top: 0.75rem;
    }

    /* Footer */
    .glass-stat-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--glass-border-subtle);
    }

    .glass-stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .glass-stat-glow {
      position: absolute;
      inset: 0;
      opacity: 0.06;
      pointer-events: none;
      filter: blur(40px);
    }

    /* Variant Classes - Map to design system tokens directly */
    .surface-default {
      background: var(--glass-surface-base);
      backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    .surface-elevated {
      background: var(--glass-surface-elevated);
      backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-crisp);
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
    }

    .surface-subtle {
      background: var(--glass-surface-muted);
      backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-sm), var(--glass-specular-top);
    }

    .surface-kpi {
      background: var(--glass-surface-base);
      backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    .surface-glow {
      background: var(--glass-surface-base);
      backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    /* Color Classes for icon background - use CSS variables */
    .color-primary .glass-stat-icon {
      background: var(--color-primary-light);
      border: 1px solid var(--color-primary-border);
      color: var(--color-primary-light);
    }

    .color-success .glass-stat-icon {
      background: var(--color-success-light);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-light);
    }

    .color-warning .glass-stat-icon {
      background: var(--color-warning-light);
      border: 1px solid var(--color-warning-border);
      color: var(--color-warning-light);
    }

    .color-danger .glass-stat-icon {
      background: var(--color-danger-light);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger-light);
    }

    .color-info .glass-stat-icon {
      background: var(--color-info-light);
      border: 1px solid var(--color-info-border);
      color: var(--color-info-light);
    }

    .color-neutral .glass-stat-icon {
      background: var(--color-surface-hover);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    /* Interactive */
    .interactive-true {
      cursor: pointer;
    }

    .interactive-true:hover {
      transform: translateY(-2px);
    }

    .interactive-true.color-primary:hover {
      border-color: var(--color-primary-border);
      box-shadow: var(--glass-shadow-lg), var(--glass-shadow-glow-accent);
    }

    .interactive-true.color-success:hover {
      border-color: var(--color-success-border);
      box-shadow: var(--glass-shadow-lg), var(--glass-shadow-glow-success);
    }

    .interactive-true.color-warning:hover {
      border-color: var(--color-warning-border);
      box-shadow: var(--glass-shadow-lg), var(--glass-shadow-glow-warning);
    }

    .interactive-true.color-danger:hover {
      border-color: var(--color-danger-border);
      box-shadow: var(--glass-shadow-lg), var(--glass-shadow-glow-danger);
    }

    .interactive-true.color-info:hover {
      border-color: var(--color-info-border);
      box-shadow: var(--glass-shadow-lg), var(--glass-shadow-glow-info);
    }

    .interactive-true.color-neutral:hover {
      border-color: var(--glass-border-crisp);
      box-shadow: var(--glass-shadow-lg);
    }

    /* Footer Badge Colors - use CSS variables */
    .badge-primary {
      background: var(--color-primary-light);
      color: var(--color-primary-light);
      border: 1px solid var(--color-primary-border);
    }

    .badge-success {
      background: var(--color-success-light);
      color: var(--color-success-light);
      border: 1px solid var(--color-success-border);
    }

    .badge-warning {
      background: var(--color-warning-light);
      color: var(--color-warning-light);
      border: 1px solid var(--color-warning-border);
    }

    .badge-danger {
      background: var(--color-danger-light);
      color: var(--color-danger-light);
      border: 1px solid var(--color-danger-border);
    }

    .badge-info {
      background: var(--color-info-light);
      color: var(--color-info-light);
      border: 1px solid var(--color-info-border);
    }

    .badge-neutral {
      background: var(--color-neutral-light);
      color: var(--color-neutral-light);
      border: 1px solid var(--color-neutral-border);
    }
  `],
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
  @Input() glowColor = '';

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
        `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  get iconHtml(): SafeHtml {
    return this.safeIcon;
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