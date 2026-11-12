import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCardData {
  label: string;
  value: string | number;
  trend?: number; // percentage change
  icon?: string;
  prefix?: string;
  suffix?: string;
  color?: 'primary' | 'success' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card bg-background-primary border border-border-light rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between">
        <div class="stat-card-content flex-1">
          <p class="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            {{ label }}
          </p>
          <h3 class="text-2xl font-bold text-text-primary" [innerHTML]="formattedValue"></h3>
          @if (trend !== undefined) {
            <div class="mt-2 flex items-center gap-1">
              @if (trend >= 0) {
                <svg class="w-3 h-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              } @else {
                <svg class="w-3 h-3 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              }
              <span class="text-xs" [class.text-success-500]="trend >= 0" [class.text-error-500]="trend < 0">
                {{ trend >= 0 ? '+' : '' }}{{ trend }}%
              </span>
            </div>
          }
        </div>
        @if (icon) {
          <div class="stat-card-icon flex-shrink-0 ml-3" [innerHTML]="iconHtml"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--color-background-primary);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-4);
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-md);
    }
    .stat-card-icon {
      min-width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trend?: number;
  @Input() icon?: string;
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() color: 'primary' | 'success' | 'warning' | 'neutral' = 'primary';

  get iconHtml(): string {
    return this.icon || '';
  }

  get formattedValue(): string {
    const prefix = this.prefix || '';
    const suffix = this.suffix || '';

    if (typeof this.value === 'number') {
      // Format large numbers
      if (this.value >= 1000000) {
        return `${prefix}${(this.value / 1000000).toFixed(1)}M${suffix}`;
      } else if (this.value >= 1000) {
        return `${prefix}${(this.value / 1000).toFixed(1)}K${suffix}`;
      }
      return `${prefix}${this.value}${suffix}`;
    }
    return `${prefix}${this.value}${suffix}`;
  }
}