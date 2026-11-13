import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GlassTabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

@Component({
  selector: 'glass-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-tabs-track inline-flex items-center p-1 rounded-2xl relative select-none">
      <!-- Specular Refraction Highlight Line -->
      <span class="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-2xl bg-gradient-to-r from-transparent via-white/80 to-transparent"></span>

      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          (click)="selectTab(tab.id)"
          class="glass-tab-btn relative z-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 outline-none flex items-center gap-2 cursor-pointer"
          [class.active]="activeTab === tab.id"
          [class.inactive]="activeTab !== tab.id"
        >
          <span>{{ tab.label }}</span>
          @if (tab.badge !== undefined) {
            <span
              class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              [class.bg-blue-100]="activeTab === tab.id"
              [class.text-blue-700]="activeTab === tab.id"
              [class.bg-slate-200/60]="activeTab !== tab.id"
              [class.text-slate-600]="activeTab !== tab.id"
            >
              {{ tab.badge }}
            </span>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .glass-tabs-track {
      background: var(--glass-surface-muted, rgba(255, 255, 255, 0.55));
      backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: inset 0 1px 3px 0 rgba(15, 23, 42, 0.04), var(--glass-specular-top);
      gap: 0.25rem;
    }

    .glass-tab-btn {
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .glass-tab-btn.inactive {
      color: var(--color-text-secondary, #64748b);
    }
    .glass-tab-btn.inactive:hover {
      color: var(--color-text-primary, #0f172a);
      background: rgba(255, 255, 255, 0.40);
    }

    .glass-tab-btn.active {
      color: #1d4ed8;
      background: #ffffff;
      box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.10), 0 1px 2px 0 rgba(15, 23, 42, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.90);
      border: 1px solid rgba(226, 232, 240, 0.90);
    }

    [data-theme="dark"] .glass-tab-btn.active {
      background: rgba(30, 41, 59, 0.95);
      color: #60a5fa;
      border-color: rgba(51, 65, 85, 0.90);
      box-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.35);
    }
  `],
})
export class GlassTabsComponent {
  @Input({ required: true }) tabs: GlassTabItem[] = [];
  @Input({ required: true }) activeTab!: string;
  @Output() activeTabChange = new EventEmitter<string>();

  selectTab(id: string): void {
    if (this.activeTab !== id) {
      this.activeTab = id;
      this.activeTabChange.emit(id);
    }
  }
}

