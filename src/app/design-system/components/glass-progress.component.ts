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
  styles: [`
    :host {
      display: block;
    }

    .glass-progress-track {
      background: #0F172A;
      border: 1px solid #263449;
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
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
      }
    }

    .glass-progress-label {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #94A3B8;
    }

    /* Variant Backgrounds */
    .variant-default .glass-progress-track {
      background: #0F172A;
    }

    .variant-success .glass-progress-track {
      background: #0F172A;
      border-color: #10B981;
    }

    .variant-warning .glass-progress-track {
      background: #0F172A;
      border-color: #F59E0B;
    }

    .variant-danger .glass-progress-track {
      background: #0F172A;
      border-color: #EF4444;
    }

    .variant-info .glass-progress-track {
      background: #0F172A;
      border-color: #38BDF8;
    }

    /* Fill Variants */
    .fill-default {
      background: linear-gradient(90deg, #3B82F6, #60A5FA);
    }

    .fill-success {
      background: linear-gradient(90deg, #10B981, #34D399);
    }

    .fill-warning {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
    }

    .fill-danger {
      background: linear-gradient(90deg, #EF4444, #F87171);
    }

    .fill-info {
      background: linear-gradient(90deg, #38BDF8, #60A5FA);
    }

    /* Specular highlight on fill */
    .glass-progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), transparent);
    }
  `],
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