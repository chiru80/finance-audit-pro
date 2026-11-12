import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner flex items-center justify-center" [class]="containerClasses">
      <div class="animate-spin rounded-full border-2 border-t-transparent border-primary-500 border-opacity-20" [class]="spinnerClasses"></div>
      @if (showText) {
        <span class="ml-3 text-sm text-text-secondary">{{ text }}</span>
      }
    </div>
  `,
  styleUrls: ['./loading-spinner.component.css'],
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showText = false;
  @Input() text = 'Loading...';

  get containerClasses(): string {
    return `w-full py-8`;
  }

  get spinnerClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'h-4 w-4 border-2';
      case 'lg':
        return 'h-8 w-8 border-4';
      default:
        return 'h-6 w-6';
    }
  }
}
