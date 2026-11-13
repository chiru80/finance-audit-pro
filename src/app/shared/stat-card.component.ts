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
    <div
      class="stat-glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 select-none border border-slate-200/90 shadow-sm"
      [ngClass]="cardGlowClass"
    >
      <!-- Specular Refraction Highlight Line -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent"></div>

      <div class="flex items-start justify-between gap-4 relative z-10">
        <div class="stat-card-content flex-1 min-w-0">
          <p class="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 truncate">
            {{ label }}
          </p>
          <h3 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight" [innerHTML]="formattedValue"></h3>
          @if (trend !== undefined) {
            <div class="mt-3 flex items-center gap-1.5 text-xs font-medium">
              @if (trend >= 0) {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">
                  <svg class="w-3 h-3 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                  +{{ trend }}%
                </span>
              } @else {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-500/30">
                  <svg class="w-3 h-3 text-rose-700 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                  {{ trend }}%
                </span>
              }
              <span class="text-slate-500 dark:text-slate-400 font-medium">vs last week</span>
            </div>
          }
        </div>

        @if (icon) {
          <div
            class="stat-card-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-xs"
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

    .stat-glass-card {
      background: var(--glass-surface-base, rgba(255, 255, 255, 0.78));
      backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .stat-glass-card:hover {
      transform: translateY(-2px) var(--glass-scale-hover, scale(1.012));
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
    }

    .stat-glass-card:hover .stat-card-icon {
      transform: scale(1.06);
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

  get cardGlowClass(): string {
    switch (this.color) {
      case 'primary':
        return 'hover:border-blue-300/80 dark:hover:border-blue-600/60';
      case 'success':
        return 'hover:border-emerald-300/80 dark:hover:border-emerald-600/60';
      case 'warning':
        return 'hover:border-amber-300/80 dark:hover:border-amber-600/60';
      case 'neutral':
      default:
        return 'hover:border-slate-300 dark:hover:border-slate-600';
    }
  }

  get iconColorClasses(): string {
    switch (this.color) {
      case 'primary':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50';
      case 'success':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
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
