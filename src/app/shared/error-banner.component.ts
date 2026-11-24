import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shown) {
      <div
        class="error-banner bg-[var(--color-danger-tint)] border border-[var(--color-danger-border)] rounded-xl p-4 mb-4 backdrop-blur-sm"
        role="alert"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-[var(--color-danger-text)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-semibold text-[var(--color-danger-text)]">{{ title }}</h4>
            @if (message) {
              <p class="mt-1 text-sm text-[var(--color-danger-text)]">{{ message }}</p>
            }
          </div>
          @if (showDismiss) {
            <div class="ml-auto pl-3">
              <button
                (click)="dismissError()"
                class="inline-flex items-center p-1 rounded-md text-[var(--color-danger-text)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-danger-tint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-border)] cursor-pointer"
                aria-label="Dismiss"
              >
                <span class="sr-only">Dismiss</span>
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrls: ['./error-banner.component.css'],
})
export class ErrorBannerComponent {
  @Input() title = 'Error';
  @Input() message?: string;
  @Input() shown = true;
  @Input() showDismiss = true;
  @Output() dismiss = new EventEmitter<void>();

  dismissError(): void {
    this.dismiss.emit();
  }
}
