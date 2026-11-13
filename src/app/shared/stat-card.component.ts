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
      class="stat-dark-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 select-none bg-[#151F32] border border-[#263449] shadow-lg hover:shadow-xl"
      [ngClass]="cardGlowClass"
    >
      <!-- Specular Refraction Highlight Line -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div class="flex items-start justify-between gap-4 relative z-10">
        <div class="stat-card-content flex-1 min-w-0">
          <p class="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 truncate">
            {{ label }}
          </p>
          <h3 class="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight" [innerHTML]="formattedValue"></h3>
          @if (trend !== undefined) {
            <div class="mt-3 flex items-center gap-1.5 text-xs font-medium">
              @if (trend >= 0) {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#34D399] font-bold border border-emerald-500/30">
                  <svg class="w-3 h-3 text-[#34D399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                  +{{ trend }}%
                </span>
              } @else {
                <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-[#F87171] font-bold border border-rose-500/30">
                  <svg class="w-3 h-3 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                  {{ trend }}%
                </span>
              }
              <span class="text-[#64748B] font-medium">vs last week</span>
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

    .stat-dark-card {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-dark-card:hover {
      transform: translateY(-2px);
    }

    .stat-dark-card:hover .stat-card-icon {
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
        return 'hover:border-[#3B82F6]/60 hover:shadow-blue-900/20';
      case 'success':
        return 'hover:border-[#10B981]/60 hover:shadow-emerald-900/20';
      case 'warning':
        return 'hover:border-[#F59E0B]/60 hover:shadow-amber-900/20';
      case 'neutral':
      default:
        return 'hover:border-[#33435C]';
    }
  }

  get iconColorClasses(): string {
    switch (this.color) {
      case 'primary':
        return 'bg-blue-500/15 text-[#38BDF8] border border-blue-500/30';
      case 'success':
        return 'bg-emerald-500/15 text-[#34D399] border border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-[#FBBF24] border border-amber-500/30';
      case 'neutral':
      default:
        return 'bg-[#18243A] text-[#94A3B8] border border-[#263449]';
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
