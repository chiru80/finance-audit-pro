import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type GlassSkeletonVariant = 'card' | 'table' | 'list' | 'chart';

@Component({
  selector: 'glass-skeleton',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="glass-skeleton-root" [ngClass]="variantClasses">
      <!-- Shimmer Animation -->
      <div class="glass-skeleton-shimmer"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .glass-skeleton-root {
        position: relative;
        background: var(--glass-surface-base);
        border: 1px solid var(--glass-border-subtle);
        border-radius: 16px;
        overflow: hidden;
      }

      .glass-skeleton-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          rgba(230, 218, 199, 0.05) 0%,
          rgba(230, 218, 199, 0.11) 50%,
          rgba(230, 218, 199, 0.05) 100%
        );
        background-size: 200% 100%;
        animation: glass-skeleton-shimmer 1.5s ease-in-out infinite;
      }

      @keyframes glass-skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Card Variant */
      .variant-card {
        width: 100%;
        height: 180px;
      }

      /* Table Variant */
      .variant-table {
        width: 100%;
        height: 400px;
      }

      /* List Variant */
      .variant-list {
        width: 100%;
        height: 300px;
      }

      /* Chart Variant */
      .variant-chart {
        width: 100%;
        height: 240px;
      }
    `,
  ],
})
export class GlassSkeletonComponent {
  @Input() variant: GlassSkeletonVariant = 'card';

  get variantClasses(): string {
    return `glass-skeleton-root variant-${this.variant}`;
  }
}
