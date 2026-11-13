import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassBadgeStatus = 'paid' | 'pending' | 'overdue' | 'active' | 'neutral' | 'accent';
export type GlassBadgeSize = 'sm' | 'md';

@Component({
  selector: 'glass-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="glass-badge-root inline-flex items-center font-semibold rounded-full select-none"
      [ngClass]="[statusClasses, sizeClasses]"
    >
      <!-- Luminous Dot Indicator -->
      <span class="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" [ngClass]="dotClasses"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .glass-badge-root {
      backdrop-filter: blur(var(--glass-blur-xs, 6px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-xs, 6px)) saturate(var(--glass-saturate, 185%));
      box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.40);
    }

    /* Paid / Success */
    .status-paid {
      background: rgba(22, 163, 74, 0.12);
      color: #15803d;
      border: 1px solid rgba(22, 163, 74, 0.25);
    }
    .dot-paid {
      background: #16a34a;
      box-shadow: 0 0 6px rgba(22, 163, 74, 0.6);
    }

    /* Pending / Warning */
    .status-pending {
      background: rgba(217, 119, 6, 0.12);
      color: #b45309;
      border: 1px solid rgba(217, 119, 6, 0.25);
    }
    .dot-pending {
      background: #d97706;
      box-shadow: 0 0 6px rgba(217, 119, 6, 0.6);
    }

    /* Overdue / Danger */
    .status-overdue {
      background: rgba(220, 38, 38, 0.12);
      color: #b91c1c;
      border: 1px solid rgba(220, 38, 38, 0.25);
    }
    .dot-overdue {
      background: #dc2626;
      box-shadow: 0 0 6px rgba(220, 38, 38, 0.6);
    }

    /* Active / Accent */
    .status-active, .status-accent {
      background: rgba(37, 99, 235, 0.12);
      color: #1d4ed8;
      border: 1px solid rgba(37, 99, 235, 0.25);
    }
    .dot-active, .dot-accent {
      background: #2563eb;
      box-shadow: 0 0 6px rgba(37, 99, 235, 0.6);
    }

    /* Neutral */
    .status-neutral {
      background: rgba(100, 116, 139, 0.12);
      color: #475569;
      border: 1px solid rgba(100, 116, 139, 0.25);
    }
    .dot-neutral {
      background: #64748b;
    }

    /* Sizes */
    .size-sm {
      padding: 0.15rem 0.55rem;
      font-size: 0.70rem;
    }
    .size-md {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }
  `],
})
export class GlassBadgeComponent {
  @Input() status: GlassBadgeStatus = 'neutral';
  @Input() set variant(val: GlassBadgeStatus) {
    if (val) this.status = val;
  }
  @Input() dot = true;
  @Input() size: GlassBadgeSize = 'md';

  get statusClasses(): string {
    return `status-${this.status}`;
  }

  get dotClasses(): string {
    return `dot-${this.status}`;
  }

  get sizeClasses(): string {
    return `size-${this.size}`;
  }
}
