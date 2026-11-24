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
      class="glass-badge-root inline-flex items-center font-semibold rounded-md select-none"
      [ngClass]="[statusClasses, sizeClasses]"
    >
      @if (dot) {
        <span
          class="badge-dot w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
          [ngClass]="dotClasses"
        ></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .glass-badge-root {
        letter-spacing: 0.015em;
        white-space: nowrap;
      }

      /* Paid / Success */
      .status-paid {
        background: var(--color-success-tint);
        color: var(--color-success-text);
        border: 1px solid var(--color-success-border);
      }
      .dot-paid {
        background: var(--color-success-text);
      }

      /* Pending / Warning */
      .status-pending {
        background: var(--color-warning-tint);
        color: var(--color-warning-text);
        border: 1px solid var(--color-warning-border);
      }
      .dot-pending {
        background: var(--color-warning-text);
      }

      /* Overdue / Danger */
      .status-overdue {
        background: var(--color-danger-tint);
        color: var(--color-danger-text);
        border: 1px solid var(--color-danger-border);
      }
      .dot-overdue {
        background: var(--color-danger-text);
      }

      /* Active / Accent */
      .status-active,
      .status-accent {
        background: var(--color-primary-tint);
        color: var(--color-primary-text);
        border: 1px solid var(--color-primary-border);
      }
      .dot-active,
      .dot-accent {
        background: var(--color-primary-text);
      }

      /* Neutral */
      .status-neutral {
        background: var(--color-neutral-tint);
        color: var(--color-neutral-text);
        border: 1px solid var(--color-neutral-border);
      }
      .dot-neutral {
        background: var(--color-neutral-text);
      }

      .size-sm {
        padding: 0.1875rem 0.5rem;
        font-size: 0.6875rem;
      }
      .size-md {
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
      }
    `,
  ],
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
