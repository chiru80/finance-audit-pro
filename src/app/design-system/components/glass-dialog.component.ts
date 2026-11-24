import type { AfterViewInit, OnDestroy, ElementRef, OnInit } from '@angular/core';
import { Component, Input, Output, EventEmitter, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassButtonComponent } from './glass-button.component';

type GlassDialogVariant = 'primary' | 'danger';

@Component({
  selector: 'glass-dialog',
  standalone: true,
  imports: [CommonModule, GlassButtonComponent],
  template: `
    @if (isOpen) {
      <div
        class="glass-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        (click)="onBackdropClick()"
        role="dialog"
        [attr.aria-modal]="'true'"
        [attr.aria-labelledby]="'glass-dialog-title-' + dialogId"
        [attr.aria-describedby]="'glass-dialog-desc-' + dialogId"
      >
        <!-- Frosted Backdrop Blur -->
        <div
          class="fixed inset-0 bg-[var(--glass-surface-overlay)]/80 backdrop-blur-md transition-opacity duration-200"
          (click)="onBackdropClick()"
        ></div>

        <!-- Floating Glass Modal Card -->
        <div
          class="glass-dialog-surface relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden transform transition-all duration-200"
          #dialogContainer
          (keydown.escape)="onCancel()"
        >
          <!-- Specular Refraction Highlight Line -->

          <!-- Dialog Header & Icon -->
          <div class="flex items-start gap-4 mb-4">
            @if (variant === 'danger') {
              <div
                class="w-10 h-10 rounded-xl bg-[var(--color-danger-text)]/15 text-[var(--color-danger-text)] border border-[var(--color-danger-text)]/25 flex items-center justify-center flex-shrink-0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            } @else {
              <div
                class="w-10 h-10 rounded-xl bg-[var(--primary-accent)]/15 text-[var(--color-info-text)] border border-[var(--primary-accent)]/25 flex items-center justify-center flex-shrink-0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            }

            <div class="min-w-0 flex-1">
              <h3
                id="glass-dialog-title-{{ dialogId }}"
                class="text-lg font-bold text-[var(--text-primary)] tracking-tight leading-snug"
              >
                {{ title }}
              </h3>
              @if (description) {
                <p
                  id="glass-dialog-desc-{{ dialogId }}"
                  class="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed"
                >
                  {{ description }}
                </p>
              }
            </div>

            @if (showClose) {
              <button
                type="button"
                class="glass-dialog-close flex-shrink-0 w-8 h-8 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-elevated)] border border-[var(--glass-border-subtle)] flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] focus:ring-offset-0"
                (click)="onCancel()"
                aria-label="Close dialog"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            }
          </div>

          <!-- Projected Body (optional custom content) -->
          <div class="mb-6 focus-guard" #dialogBody>
            <ng-content></ng-content>
          </div>

          <!-- Dialog Actions Footer -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <glass-button variant="glass" size="md" (onClick)="onCancel()">
              {{ cancelLabel }}
            </glass-button>

            <glass-button
              [variant]="variant === 'danger' ? 'danger' : 'filled'"
              size="md"
              (click)="onConfirm()"
            >
              {{ confirmLabel }}
            </glass-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .glass-dialog-surface {
        background: var(--glass-surface-muted);
        border: 1px solid var(--glass-border-subtle);
        box-shadow: var(--glass-shadow-xl);
        animation: dialogPop 200ms cubic-bezier(0.16, 1, 0.3, 1);
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

      /* Focus trap guard - prevents natural tab order from escaping */
      .focus-guard:focus-within {
        outline: none;
      }
    `,
  ],
})
export class GlassDialogComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() description = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: GlassDialogVariant = 'primary';
  @Input() showClose = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialogContainer', { static: false }) dialogContainer!: ElementRef<HTMLElement>;
  @ViewChild('dialogBody', { static: false }) dialogBody!: ElementRef<HTMLElement>;

  private dialogId = 'dlg-' + Math.random().toString(36).substring(2, 9);
  private focusTrapActive = false;
  private lastFocusedElement: HTMLElement | null = null;

  constructor() {}

  ngOnInit(): void {
    // Generate unique dialog ID
    this.dialogId = 'dlg-' + Math.random().toString(36).substring(2, 9);
  }

  ngAfterViewInit(): void {
    // Focus trap setup happens after isOpen becomes true
  }

  ngOnDestroy(): void {
    this.releaseFocusTrap();
  }

  open(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.onOpen();
    }
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.onClose();
    }
  }

  private onOpen(): void {
    // Store the previously focused element
    this.lastFocusedElement = document.activeElement as HTMLElement;

    // Wait for view to render, then focus the dialog body
    setTimeout(() => {
      if (this.dialogContainer && this.dialogContainer.nativeElement) {
        const container = this.dialogContainer.nativeElement;
        container.setAttribute('tabindex', '-1');
        container.focus();

        // Set up focus trap
        this.setupFocusTrap();
        this.focusTrapActive = true;
      }
    }, 0);
  }

  private onClose(): void {
    this.releaseFocusTrap();
    this.focusTrapActive = false;

    // Return focus to the previously focused element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  private setupFocusTrap(): void {
    if (!this.dialogContainer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!this.focusTrapActive) return;

      switch (event.key) {
        case 'Tab': {
          const focusableElements = this.getFocusableElements();
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            // Shift + Tab: move backward
            if (document.activeElement === firstElement) {
              event.preventDefault();
              firstElement.focus();
            }
          } else {
            // Tab: move forward
            if (document.activeElement === lastElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          }
          break;
        }
        case 'Escape':
          event.preventDefault();
          this.onCancel();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    this._keyDownHandler = handleKeyDown;

    // Store reference for cleanup
    (this as any)._keydownHandler = handleKeyDown;
  }

  private releaseFocusTrap(): void {
    if ((this as any)._keydownHandler) {
      document.removeEventListener('keydown', (this as any)._keydownHandler);
      (this as any)._keydownHandler = null;
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const container = this.dialogContainer?.nativeElement;
    if (!container) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]:not([contenteditable="false"])',
    ];

    const elements = container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '));
    return Array.from(elements).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0,
    );
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  onBackdropClick(): void {
    // Check if the click was on the backdrop (not the dialog itself)
    const event = new MouseEvent('click');
    const target = event.target as HTMLElement;
    const container = this.dialogContainer?.nativeElement;

    if (container && !container.contains(target)) {
      this.onCancel();
    }
  }

  private _keyDownHandler?: (event: KeyboardEvent) => void;
}
