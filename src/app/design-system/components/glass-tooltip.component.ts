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
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <!-- Tooltip Content -->
      <ng-content></ng-content>

      <!-- Arrow Indicator -->
      <div
        class="glass-tooltip-arrow"
        [ngClass]="{
          'top': position === 'top',
          'bottom': position === 'bottom',
          'left': position === 'left',
          'right': position === 'right'
        }"
      ></div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }

    .glass-tooltip-root {
      position: absolute;
      z-index: 50;
      background: #151F32;
      border: 1px solid #263449;
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.50);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #F8FAFC;
      white-space: nowrap;
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
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
      border-bottom-color: #151F32;
    }

    .glass-tooltip-arrow.bottom {
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: #151F32;
    }

    .glass-tooltip-arrow.left {
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: #151F32;
    }

    .glass-tooltip-arrow.right {
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: #151F32;
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
      background: #151F32;
      border-color: #263449;
      color: #F8FAFC;
    }

    .variant-success {
      background: #152329;
      border-color: #10B981;
      color: #34D399;
    }

    .variant-warning {
      background: #292118;
      border-color: #F59E0B;
      color: #FBBF24;
    }

    .variant-danger {
      background: #251515;
      border-color: #EF4444;
      color: #F87171;
    }

    .variant-info {
      background: #18243A;
      border-color: #38BDF8;
      color: #60A5FA;
    }
  `],
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