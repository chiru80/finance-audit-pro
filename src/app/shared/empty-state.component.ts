import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
      <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4 shadow-xs">
        @if (customIcon) {
          <div [innerHTML]="customIcon"></div>
        } @else {
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        }
      </div>
      <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">{{ title }}</h3>
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{{ message }}</p>
      @if (actionLabel) {
        <button
          type="button"
          (click)="action.emit()"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all duration-200 cursor-pointer active:scale-98"
        >
          @if (actionIcon) {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="actionIcon" />
            </svg>
          }
          <span>{{ actionLabel }}</span>
        </button>
      }
    </div>
  `,
  styleUrls: ['./empty-state.component.css'],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = 'No records found. Get started by recording a new transaction or onboarding a customer.';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() customIcon?: string;
  @Output() action = new EventEmitter<void>();
}