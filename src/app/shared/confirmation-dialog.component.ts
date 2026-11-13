import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassDialogComponent } from '../design-system/components/glass-dialog.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, GlassDialogComponent, GlassButtonComponent],
  template: `
    <glass-dialog
      [isOpen]="isOpen"
      [title]="title"
      [showClose]="true"
      (closed)="onCancel()"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <glass-button
            variant="glass"
            size="md"
            (buttonClick)="onCancel()"
          >
            {{ cancelLabel }}
          </glass-button>
          <glass-button
            variant="danger"
            size="md"
            (buttonClick)="onConfirm()"
          >
            {{ confirmLabel }}
          </glass-button>
        </div>
      </div>
    </glass-dialog>
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