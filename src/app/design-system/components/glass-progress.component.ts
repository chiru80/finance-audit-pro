import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'glass-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-progress-root" [ngClass]="variantClasses">
      <!-- Background Track -->
      <div class="glass-progress-track">
        <!-- Fill Track -->
        <div
          class="glass-progress-fill"
          [style.width.%]="value"
          [ngClass]="fillVariantClasses"
        ></div>
      </div>

      <!-- Percentage Label (optional) -->
      @if (showLabel) {
        <div class="glass-progress-label">
          {{ label }}{{ value !== undefined ? ' (' + value + '%)' : '' }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .glass-progress-track {
        background: var(--glass-surface-dock);
        border: 1px solid var(--glass-border-subtle);
        border-radius: 12px;
        height: 12px;
        overflow: hidden;
        position: relative;
      }

      .glass-progress-fill {
        height: 100%;
        border-radius: 12px;
        transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;

        /* Glow effect for completed progress */
        &.complete {
          box-shadow: none;
        }
      }

      .glass-progress-label {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      /* Variant Backgrounds */
      .variant-default .glass-progress-track {
        background: var(--glass-surface-dock);
      }

      .variant-success .glass-progress-track {
        background: var(--glass-surface-dock);
        border-color: var(--color-success);
      }

      .variant-warning .glass-progress-track {
        background: var(--glass-surface-dock);
        border-color: var(--color-warning-border);
      }

      .variant-danger .glass-progress-track {
        background: var(--glass-surface-dock);
        border-color: var(--color-danger-text);
      }

      .variant-info .glass-progress-track {
        background: var(--glass-surface-dock);
        border-color: var(--color-info-text);
      }

      /* Fill Variants */
      .fill-default {
        background: linear-gradient(90deg, var(--primary-hover), var(--color-info-text));
      }

      .fill-success {
        background: linear-gradient(90deg, var(--color-success), var(--color-success-text));
      }

      .fill-warning {
        background: var(--color-warning-text);
      }

      .fill-danger {
        background: linear-gradient(90deg, var(--color-danger-text), var(--color-danger-text));
      }

      .fill-info {
        background: linear-gradient(90deg, var(--color-info-text), var(--color-info-text));
      }

      /* Specular highlight on fill */
      .glass-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: var(--glass-surface-active);
      }
    `,
  ],
})
export class GlassProgressComponent {
  @Input() value: number = 0;
  @Input() variant: GlassProgressVariant = 'default';
  @Input() showLabel: boolean = false;
  @Input() label: string = '';

  get variantClasses(): string {
    return `glass-progress-root variant-${this.variant}`;
  }

  get fillVariantClasses(): string {
    if (this.value >= 90) return 'fill-success complete';
    if (this.value >= 70) return 'fill-info';
    if (this.value >= 50) return 'fill-warning';
    return 'fill-default';
  }
}
