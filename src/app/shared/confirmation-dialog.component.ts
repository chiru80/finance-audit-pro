import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [],
  template: `
    @if (isOpen) {
      <div class="confirmation-dialog fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-6 sm:pt-5">
          <div
            class="fixed inset-0 bg-gray-400 bg-opacity-75"
            (click)="onOverlayClick()"
          ></div>

          <div class="relative bg-background-primary rounded-lg px-4 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:px-6">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <div class="flex justify-center items-center w-12 h-12 mx-auto bg-warning-100 rounded-full">
                  <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-text-primary">
                  {{ title }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-text-secondary">
                    {{ message }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4 sm:mt-4 sm:flex sm:justify-end sm:space-x-3">
              <button
                type="button"
                class="inline-flex justify-center w-auto px-4 py-2 bg-border-light text-sm font-medium rounded-lg text-slate-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3"
                (click)="onCancel()"
              >
                {{ cancelLabel }}
              </button>
              <button
                type="button"
                class="inline-flex justify-center w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-error-500 hover:bg-error-600 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 sm:ml-3"
                (click)="onConfirm()"
              >
                {{ confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirmation-dialog.component.css'],
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed? This action cannot be undone.';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmLabel = 'Confirm';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isOpen = false;
  }

  onOverlayClick(): void {
    this.isOpen = false;
  }
}