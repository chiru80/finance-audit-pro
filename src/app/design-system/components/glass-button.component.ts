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
      class="glass-btn-root inline-flex items-center justify-center font-semibold select-none relative overflow-hidden transition-all duration-150 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:ring-offset-1 focus:ring-offset-[#0B1120] cursor-pointer"
      [ngClass]="[variantClasses, sizeClasses, disabledClasses, customClass]"
    >
      <!-- Specular Refraction Highlight Line -->
      <span class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>

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
      border-radius: 12px;
    }

    .glass-btn-root:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .glass-btn-root:active:not(:disabled) {
      transform: scale(0.985);
    }

    /* Variant: Filled (Vibrant Primary) */
    .variant-filled {
      background: #2563EB;
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.35);
    }

    .variant-filled:hover:not(:disabled) {
      background: #3B82F6;
      box-shadow: 0 6px 18px 0 rgba(37, 99, 235, 0.45);
    }

    .variant-filled:active:not(:disabled) {
      background: #1D4ED8;
    }

    /* Variant: Glass / Secondary (Dark Elevated Button) */
    .variant-glass {
      background: #18243A;
      color: #F8FAFC;
      border: 1px solid #263449;
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.3);
    }

    .variant-glass:hover:not(:disabled) {
      background: #1E2D47;
      border-color: #334460;
      color: #FFFFFF;
    }

    .variant-glass:active:not(:disabled) {
      background: #151F32;
    }

    /* Variant: Tinted (Subtle Blue / Info) */
    .variant-tinted {
      background: rgba(37, 99, 235, 0.15);
      color: #60A5FA;
      border: 1px solid rgba(37, 99, 235, 0.30);
    }

    .variant-tinted:hover:not(:disabled) {
      background: rgba(37, 99, 235, 0.25);
      color: #93C5FD;
      border-color: rgba(37, 99, 235, 0.45);
    }

    /* Variant: Danger */
    .variant-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.30);
    }

    .variant-danger:hover:not(:disabled) {
      background: #EF4444;
      color: #FFFFFF;
      border-color: #EF4444;
      box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);
    }

    /* Sizes */
    .size-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      height: 34px;
      border-radius: 10px;
    }

    .size-md {
      padding: 0.5rem 1.125rem;
      font-size: 0.875rem;
      height: 42px;
      border-radius: 12px;
    }

    .size-lg {
      padding: 0.625rem 1.375rem;
      font-size: 0.9375rem;
      height: 46px;
      border-radius: 12px;
    }

    .btn-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
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
