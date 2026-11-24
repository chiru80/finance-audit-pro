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
    <div class="glass-tabs-track inline-flex items-center select-none" role="tablist">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          role="tab"
          (click)="selectTab(tab.id)"
          class="glass-tab-btn relative z-10 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all outline-none flex items-center gap-2 cursor-pointer"
          [class.active]="activeTab === tab.id"
          [class.inactive]="activeTab !== tab.id"
          [attr.aria-selected]="activeTab === tab.id"
        >
          <span>{{ tab.label }}</span>
          @if (tab.badge !== undefined) {
            <span class="tab-badge" [class.is-active]="activeTab === tab.id">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .glass-tabs-track {
        background: var(--glass-surface-muted);
        border: 1px solid var(--glass-border-subtle);
        border-radius: 11px;
        box-shadow: var(--glass-shadow-xs);
        padding: 3px;
        gap: 2px;
      }

      .glass-tab-btn {
        transition-timing-function: var(--glass-spring-easing);
      }

      .glass-tab-btn.inactive {
        color: var(--text-secondary);
      }
      .glass-tab-btn.inactive:hover {
        color: var(--text-primary);
        background: var(--color-surface-hover);
      }

      .glass-tab-btn.active {
        color: var(--text-primary);
        background: var(--glass-surface-elevated);
        box-shadow: var(--glass-shadow-sm);
        border: 1px solid var(--glass-border-crisp);
      }

      .tab-badge {
        padding: 0.0625rem 0.4375rem;
        border-radius: 999px;
        font-size: 0.625rem;
        font-weight: 700;
        background: var(--color-neutral-tint);
        color: var(--color-neutral-text);
      }
      .tab-badge.is-active {
        background: var(--color-primary-tint);
        color: var(--color-primary-text);
      }
    `,
  ],
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
