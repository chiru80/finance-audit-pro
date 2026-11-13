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
      <span class="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>

      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          (click)="selectTab(tab.id)"
          class="glass-tab-btn relative z-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 outline-none flex items-center gap-2 cursor-pointer"
          [class.active]="activeTab === tab.id"
          [class.inactive]="activeTab !== tab.id"
        >
          <span>{{ tab.label }}</span>
          @if (tab.badge !== undefined) {
            <span
              class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              [class.bg-[#2563EB]/25]="activeTab === tab.id"
              [class.text-[#38BDF8]="activeTab === tab.id"
              [class.bg-[#18243A]="activeTab !== tab.id"
              [class.text-[#94A3B8]="activeTab !== tab.id"
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
      background: #0F172A;
      border: 1px solid #263449;
      box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.4);
      gap: 0.25rem;
    }

    .glass-tab-btn {
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }

    .glass-tab-btn.inactive {
      color: #94A3B8;
    }
    .glass-tab-btn.inactive:hover {
      color: #F8FAFC;
      background: rgba(255, 255, 255, 0.05);
    }

    .glass-tab-btn.active {
      color: #F8FAFC;
      background: #18243A;
      box-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.4);
      border: 1px solid #334460;
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
