import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassTooltipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'glass-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-tooltip-root" [ngClass]="[positionClasses, variantClasses]">
      <!-- Specular Highlight -->

      <!-- Tooltip Content -->
      <ng-content></ng-content>

      <!-- Arrow Indicator -->
      <div
        class="glass-tooltip-arrow"
        [ngClass]="{
          top: position === 'top',
          bottom: position === 'bottom',
          left: position === 'left',
          right: position === 'right',
        }"
      ></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }

      .glass-tooltip-root {
        position: absolute;
        z-index: 50;
        background: var(--glass-surface-base);
        border: 1px solid var(--glass-border-subtle);
        box-shadow: var(--glass-shadow-lg);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        pointer-events: none;
        transition:
          opacity 0.15s ease,
          transform 0.15s ease;
        transform: translateY(-8px);
        opacity: 0;
        visibility: hidden;
      }

      .glass-tooltip-root.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .glass-tooltip-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
      }

      .glass-tooltip-arrow.top {
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: var(--glass-surface-base);
      }

      .glass-tooltip-arrow.bottom {
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: var(--glass-surface-base);
      }

      .glass-tooltip-arrow.left {
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: var(--glass-surface-base);
      }

      .glass-tooltip-arrow.right {
        left: -6px;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: var(--glass-surface-base);
      }

      /* Position Classes */
      .top {
        bottom: 100%;
        margin-bottom: 8px;
      }

      .bottom {
        top: 100%;
        margin-top: 8px;
      }

      .left {
        right: 100%;
        margin-right: 8px;
      }

      .right {
        left: 100%;
        margin-left: 8px;
      }

      /* Variants */
      .variant-default {
        background: var(--glass-surface-base);
        border-color: var(--glass-border-subtle);
        color: var(--text-primary);
      }

      .variant-success {
        background: var(--glass-surface-elevated);
        border-color: var(--color-success);
        color: var(--color-success-text);
      }

      .variant-warning {
        background: var(--color-warning-tint);
        border-color: var(--color-warning-border);
        color: var(--color-warning-text);
      }

      .variant-danger {
        background: var(--color-danger-tint);
        border-color: var(--color-danger-text);
        color: var(--color-danger-text);
      }

      .variant-info {
        background: var(--glass-surface-elevated);
        border-color: var(--color-info-text);
        color: var(--color-info-text);
      }
    `,
  ],
})
export class GlassTooltipComponent {
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() variant: GlassTooltipVariant = 'default';
  @Input() show = false;

  get positionClasses(): string {
    return this.position;
  }

  get variantClasses(): string {
    return `variant-${this.variant}`;
  }
}
