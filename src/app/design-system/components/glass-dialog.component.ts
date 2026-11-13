import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassButtonComponent } from './glass-button.component';

@Component({
  selector: 'glass-dialog',
  standalone: true,
  imports: [CommonModule, GlassButtonComponent],
  template: `
    @if (isOpen) {
      <div class="glass-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <!-- Frosted Backdrop Blur -->
        <div
          class="fixed inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity duration-300"
          (click)="onCancel()"
        ></div>

        <!-- Floating Glass Modal Card -->
        <div
          class="glass-dialog-surface relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden transform transition-all duration-300"
        >
          <!-- Specular Refraction Highlight Line -->
          <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent"></div>

          <!-- Dialog Header & Icon -->
          <div class="flex items-start gap-4 mb-4">
            @if (variant === 'danger') {
              <div class="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            } @else {
              <div class="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }

            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {{ title }}
              </h3>
              @if (description) {
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {{ description }}
                </p>
              }
            </div>
          </div>

          <!-- Projected Body (optional custom content) -->
          <div class="mb-6">
            <ng-content></ng-content>
          </div>

          <!-- Dialog Actions Footer -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <glass-button
              variant="glass"
              size="md"
              (onClick)="onCancel()"
            >
              {{ cancelLabel }}
            </glass-button>

            <glass-button
              [variant]="variant === 'danger' ? 'danger' : 'filled'"
              size="md"
              (onClick)="onConfirm()"
            >
              {{ confirmLabel }}
            </glass-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .glass-dialog-surface {
      background: var(--glass-surface-elevated, rgba(255, 255, 255, 0.90));
      backdrop-filter: blur(var(--glass-blur-lg, 32px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-lg, 32px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-crisp, rgba(255, 255, 255, 0.85));
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
      animation: dialogPop 280ms var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
    }

    @keyframes dialogPop {
      0% {
        opacity: 0;
        transform: scale(0.96) translateY(8px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `],
})
export class GlassDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() description = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: 'primary' | 'danger' = 'primary';
  @Input() showClose = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.closed.emit();
  }
}
