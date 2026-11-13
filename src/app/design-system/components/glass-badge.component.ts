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
      @if (dot) {
        <span class="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" [ngClass]="dotClasses"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .glass-badge-root {
      box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
    }

    /* Paid / Success */
    .status-paid {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.30);
    }
    .dot-paid {
      background: #10B981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }

    /* Pending / Warning */
    .status-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.30);
    }
    .dot-pending {
      background: #F59E0B;
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    }

    /* Overdue / Danger */
    .status-overdue {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.30);
    }
    .dot-overdue {
      background: #EF4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    }

    /* Active / Accent */
    .status-active, .status-accent {
      background: rgba(37, 99, 235, 0.15);
      color: #60A5FA;
      border: 1px solid rgba(37, 99, 235, 0.30);
    }
    .dot-active, .dot-accent {
      background: #38BDF8;
      box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
    }

    /* Neutral */
    .status-neutral {
      background: rgba(100, 116, 139, 0.15);
      color: #94A3B8;
      border: 1px solid rgba(100, 116, 139, 0.30);
    }
    .dot-neutral {
      background: #64748B;
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
