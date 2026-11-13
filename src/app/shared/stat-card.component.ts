import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
    <div class="stat-card bg-background-primary border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between gap-4">
        <div class="stat-card-content flex-1 min-w-0">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 truncate">
            {{ label }}
          </p>
          <h3 class="text-2xl font-bold text-brand-900" [innerHTML]="formattedValue"></h3>
          @if (trend !== undefined) {
            <div class="mt-2 flex items-center gap-1.5 text-xs font-medium">
              @if (trend >= 0) {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-success-50 text-success-600 font-semibold border border-success-200/60">
                  <svg class="w-3 h-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                  +{{ trend }}%
                </span>
              } @else {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-error-50 text-error-600 font-semibold border border-error-200/60">
                  <svg class="w-3 h-3 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                  {{ trend }}%
                </span>
              }
              <span class="text-slate-500 font-normal">vs last week</span>
            </div>
          }
        </div>
        @if (icon) {
          <div
            class="stat-card-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            [ngClass]="iconColorClasses"
            [innerHTML]="safeIcon"
          ></div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class StatCardComponent {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trend?: number;
  @Input() icon?: string;
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() color: 'primary' | 'success' | 'warning' | 'neutral' = 'primary';

  get iconColorClasses(): string {
    switch (this.color) {
      case 'primary':
        return 'bg-accent-50 text-accent-600 border border-accent-200/80';
      case 'success':
        return 'bg-success-50 text-success-600 border border-success-200/80';
      case 'warning':
        return 'bg-warning-50 text-warning-600 border border-warning-200/80';
      case 'neutral':
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200/80';
    }
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) return '';
    let svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      svgStr = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  get formattedValue(): string {
    const prefix = this.prefix || '';
    const suffix = this.suffix || '';

    if (typeof this.value === 'number') {
      // Do not abbreviate financial data - exact values are required for audit trails
      return `${prefix}${this.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}${suffix}`;
    }
    return `${prefix}${this.value}${suffix}`;
  }
}