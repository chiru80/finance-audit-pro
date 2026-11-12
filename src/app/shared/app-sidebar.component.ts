import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { I18nService } from './i18n.service';
import { I18nPipe } from './i18n.pipe';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  labelKey: string;
  icon: string;
  routerLink: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, I18nPipe],
  template: `
    @if (sidebarService.isOpen()) {
      <aside class="sidebar w-64 bg-background-primary border-r border-border-light flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <div class="sidebar-content p-4 flex-1">
          <nav class="space-y-1">
            @for (item of navItems; track item.routerLink) {
              <a
                [routerLink]="[item.routerLink]"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-background-secondary text-text-secondary hover:text-text-primary"
                routerLinkActive="bg-primary-50 text-primary-600 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <span [innerHTML]="getIconHtml(item.icon)" class="w-5 h-5 flex-shrink-0"></span>
                <span>{{ item.labelKey | i18n }}</span>
              </a>
            }
          </nav>
        </div>

        @if (authService.isAuthenticated()) {
          <div class="p-4 border-t border-border-light">
            <div class="mb-2 px-3 text-xs text-text-muted truncate">
              {{ authService.user()?.email }}
            </div>
            <button
              (click)="signOut()"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              type="button"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{{ 'logout' | i18n }}</span>
            </button>
          </div>
        }
      </aside>
    }
  `,
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent {
  sidebarService = inject(SidebarService);
  i18n = inject(I18nService);
  authService = inject(AuthService);
  private router = inject(Router);

  navItems: NavItem[] = [
    { labelKey: 'nav.dashboard', icon: 'dashboard', routerLink: '/dashboard' },
    { labelKey: 'nav.customers', icon: 'customers', routerLink: '/customers' },
    { labelKey: 'nav.collections', icon: 'collections', routerLink: '/collections' },
    { labelKey: 'nav.ledger', icon: 'ledger', routerLink: '/ledger' },
    { labelKey: 'nav.reports', icon: 'reports', routerLink: '/reports' },
    { labelKey: 'nav.settings', icon: 'settings', routerLink: '/settings' },
  ];

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  getIconHtml(iconName: string): string {
    const icons: Record<string, string> = {
      dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l2-2m2-2v6m-2 2h6a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />`,
      customers: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m8 0h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6m8 0V10a2 2 0 00-2-2H9a2 2 0 00-2 2v8h12z" />`,
      collections: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      ledger: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
      reports: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
      settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />`,
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">${icons[iconName] || ''}</svg>`;
  }
}
