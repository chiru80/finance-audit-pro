import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state flex flex-col items-center justify-center p-6 text-center">
      <div class="empty-state-icon mb-4" [innerHTML]="iconSvg"></div>
      <h3 class="text-lg font-semibold text-text-primary mb-2">{{ title }}</h3>
      <p class="text-sm text-text-secondary mb-4 max-w-sm">{{ message }}</p>
      @if (actionLabel) {
        <button
          (click)="onActionClick()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          {{ actionLabel }}
          @if (actionIcon) {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="actionIcon" />
            </svg>
          }
        </button>
      }
    </div>
  `,
  styleUrls: ['./empty-state.component.css'],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = 'No items to display. Get started by adding your first item.';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;

  get iconSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13a7 7 0 01-7 7m-8 0a7 7 0 01-7-7m14 0a3 3 0 00-3-3h-4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3v-4z" />
    </svg>`;
  }

  onActionClick(): void {
    // Override this in parent if needed
  }
}