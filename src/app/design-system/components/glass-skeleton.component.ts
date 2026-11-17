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
  styles: [`
    :host {
      display: block;
    }

    .glass-skeleton-root {
      position: relative;
      background: #151F32;
      border: 1px solid #263449;
      border-radius: 16px;
      overflow: hidden;
    }

    .glass-skeleton-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.03) 100%
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
  `],
})
export class GlassSkeletonComponent {
  @Input() variant: GlassSkeletonVariant = 'card';

  get variantClasses(): string {
    return `glass-skeleton-root variant-${this.variant}`;
  }
}