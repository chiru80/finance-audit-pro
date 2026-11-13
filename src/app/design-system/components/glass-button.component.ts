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
      class="glass-btn-root inline-flex items-center justify-center font-semibold select-none relative overflow-hidden transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1"
      [ngClass]="[variantClasses, sizeClasses, disabledClasses, customClass]"
    >
      <!-- Specular Refraction Highlight Line -->
      <span class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent"></span>

      <!-- Loading Spinner -->
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }

      <!-- Projected Content (Label & Icons) -->
      <span class="inline-flex items-center gap-2 relative z-10">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .glass-btn-root {
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
      border-radius: var(--radius-xl, 1rem);
    }

    .glass-btn-root:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .glass-btn-root:active:not(:disabled) {
      transform: var(--glass-scale-active, scale(0.985));
    }

    /* Variant: Filled (Vibrant Primary) */
    .variant-filled {
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.35);
    }
    .variant-filled:hover:not(:disabled) {
      background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%);
      box-shadow: 0 6px 20px 0 rgba(37, 99, 235, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.45);
    }

    /* Variant: Glass (Liquid Frosted) */
    .variant-glass {
      background: var(--glass-surface-base, rgba(255, 255, 255, 0.72));
      backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      color: var(--color-text-primary, #0f172a);
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: var(--glass-shadow-sm), var(--glass-specular-rim);
    }
    .variant-glass:hover:not(:disabled) {
      background: var(--glass-surface-elevated, rgba(255, 255, 255, 0.90));
      border-color: var(--glass-border-crisp, rgba(255, 255, 255, 0.90));
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    /* Variant: Tinted (Soft Accent Glass) */
    .variant-tinted {
      background: rgba(37, 99, 235, 0.08);
      backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      color: #2563eb;
      border: 1px solid rgba(37, 99, 235, 0.20);
      box-shadow: var(--glass-shadow-sm), var(--glass-specular-top);
    }
    .variant-tinted:hover:not(:disabled) {
      background: rgba(37, 99, 235, 0.14);
      border-color: rgba(37, 99, 235, 0.35);
    }

    /* Variant: Danger (Crimson Glass) */
    .variant-danger {
      background: rgba(239, 68, 68, 0.10);
      backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.25);
      box-shadow: var(--glass-shadow-sm);
    }
    .variant-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.40);
    }

    /* Sizes */
    .size-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 0.625rem;
    }
    .size-md {
      padding: 0.55rem 1.15rem;
      font-size: 0.875rem;
      border-radius: 0.75rem;
    }
    .size-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border-radius: 0.875rem;
    }

    .btn-disabled {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }
  `],
})
export class GlassButtonComponent {
  @Input() variant: GlassButtonVariant = 'glass';
  @Input() size: GlassButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() customClass = '';

  @Output() onClick = new EventEmitter<MouseEvent>();

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

