import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassButtonVariant = 'filled' | 'glass' | 'tinted' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'glass-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="handleClick($event)"
      class="glass-btn-root inline-flex items-center justify-center font-semibold select-none relative outline-none cursor-pointer"
      [ngClass]="[variantClasses, sizeClasses, disabledClasses, customClass]"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      }
      <span class="inline-flex items-center gap-2 relative z-10">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .glass-btn-root {
        border-radius: 10px;
        letter-spacing: -0.005em;
        transition:
          background-color var(--glass-transition-fast),
          border-color var(--glass-transition-fast),
          color var(--glass-transition-fast),
          box-shadow var(--glass-transition-fast),
          transform var(--glass-transition-fast);
      }

      .glass-btn-root:focus-visible {
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: 2px;
      }

      .glass-btn-root:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .glass-btn-root:active:not(:disabled) {
        transform: translateY(0);
      }

      /* Primary action - single brand colour */
      .variant-filled {
        background: var(--primary-accent);
        color: var(--color-on-primary);
        border: 1px solid transparent;
        box-shadow: var(--glass-shadow-sm);
      }
      .variant-filled:hover:not(:disabled) {
        background: var(--primary-hover);
        color: var(--color-on-primary);
      }

      /* Secondary - grounded surface */
      .variant-glass {
        background: var(--glass-surface-elevated);
        color: var(--text-primary);
        border: 1px solid var(--glass-border-crisp);
        box-shadow: var(--glass-shadow-xs);
      }
      .variant-glass:hover:not(:disabled) {
        background: var(--color-surface-hover);
        border-color: var(--color-border-medium);
      }

      /* Tinted - restrained emphasis */
      .variant-tinted {
        background: var(--color-primary-tint);
        color: var(--color-primary-text);
        border: 1px solid var(--color-primary-border);
      }
      .variant-tinted:hover:not(:disabled) {
        background: var(--color-primary-border);
      }

      /* Destructive */
      .variant-danger {
        background: var(--color-danger-tint);
        color: var(--color-danger-text);
        border: 1px solid var(--color-danger-border);
      }
      .variant-danger:hover:not(:disabled) {
        background: var(--color-danger-text);
        color: var(--color-on-danger);
        border-color: var(--color-danger-text);
      }

      .size-sm {
        padding: 0 0.75rem;
        font-size: 0.75rem;
        height: 32px;
      }
      .size-md {
        padding: 0 1.0625rem;
        font-size: 0.8125rem;
        height: 40px;
      }
      .size-lg {
        padding: 0 1.375rem;
        font-size: 0.875rem;
        height: 44px;
      }

      .btn-disabled {
        opacity: 0.45;
        cursor: not-allowed !important;
        pointer-events: none;
      }
    `,
  ],
})
export class GlassButtonComponent {
  @Input() variant: GlassButtonVariant = 'glass';
  @Input() size: GlassButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() customClass = '';

  @Output() onClick = new EventEmitter<MouseEvent>();
  @Output() buttonClick = this.onClick;

  get variantClasses(): string {
    return `variant-${this.variant}`;
  }

  get sizeClasses(): string {
    return `size-${this.size}`;
  }

  get disabledClasses(): string {
    return this.disabled || this.loading ? 'btn-disabled' : '';
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }
}
