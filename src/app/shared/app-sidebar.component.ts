import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { I18nService } from './i18n.service';

interface NavItem {
  labelKey: string;
  icon: string;
  routerLink: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (sidebarService.isOpen()) {
      <aside class="sidebar w-64 bg-background-primary border-r border-border-light flex-shrink-0 overflow-y-auto">
        <div class="sidebar-content p-4">
          <nav class="space-y-1">
            @for (item of navItems; track item.routerLink) {
              <a
                [routerLink]="[item.routerLink]"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-background-secondary text-text-secondary hover:text-text-primary"
                routerLinkActive="bg-primary-50 text-primary-600 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <span [innerHTML]="getIconHtml(item.icon)" class="w-5 h-5 flex-shrink-0"></span>
                <span>{{ getLabel(item.labelKey) }}</span>
              </a>
            }
          </nav>
        </div>
      </aside>
    }
  `,
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent {
  sidebarService = inject(SidebarService);
  i18n = inject(I18nService);

  navItems: NavItem[] = [
    { labelKey: 'nav.dashboard', icon: 'dashboard', routerLink: '/dashboard' },
    { labelKey: 'nav.customers', icon: 'customers', routerLink: '/customers' },
    { labelKey: 'nav.collections', icon: 'collections', routerLink: '/collections' },
    { labelKey: 'nav.ledger', icon: 'ledger', routerLink: '/ledger' },
    { labelKey: 'nav.reports', icon: 'reports', routerLink: '/reports' },
    { labelKey: 'nav.settings', icon: 'settings', routerLink: '/settings' },
  ];

  async getLabel(key: string): Promise<string> {
    return this.i18n.get(key);
  }

  getIconHtml(iconName: string): string {
    const icons: Record<string, string> = {
      dashboard: `<path d="M3 12l2-2m0 0l2-2m2-2v6m-2 2h6a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />`,
      customers: `<path d="M17 20v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m8 0h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6m8 0V10a2 2 0 00-2-2H9a2 2 0 00-2 2v8h12z" />`,
      collections: `<path d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z" />`,
      ledger: `<path d="M4 6h16M4 12h16M4 18h16" />`,
      reports: `<path d="M3 3v18h18M9 17H9M5 7h14M5 11h14" />`,
      settings: `<path d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z" />`,
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">${icons[iconName] || ''}</svg>`;
  }
}