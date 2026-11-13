import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
      <aside class="sidebar w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-slate-800 flex flex-col flex-shrink-0 h-full select-none shadow-xs relative z-30 transition-all duration-300">
        <!-- Top Specular Line -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

        <!-- Brand Header -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex-shrink-0">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/30 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="min-w-0">
            <h1 class="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">Finance Audit Pro</h1>
            <span class="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block mt-1">AUDIT ENGINE</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <div class="sidebar-content p-3 flex-1 overflow-y-auto space-y-6">
          <!-- Main Section -->
          <div>
            <p class="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Core Navigation</p>
            <nav class="space-y-1">
              @for (item of mainNavItems; track item.routerLink) {
                <a
                  [routerLink]="[item.routerLink]"
                  class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  routerLinkActive="active-nav-link"
                  [routerLinkActiveOptions]="{ exact: item.routerLink === '/dashboard' }"
                >
                  <span [innerHTML]="getIconHtml(item.icon)" class="w-5 h-5 flex-shrink-0 flex items-center justify-center"></span>
                  <span class="truncate">{{ item.labelKey | i18n }}</span>
                </a>
              }
            </nav>
          </div>

          <!-- Administration Section -->
          <div>
            <p class="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Administration</p>
            <nav class="space-y-1">
              @for (item of adminNavItems; track item.routerLink) {
                <a
                  [routerLink]="[item.routerLink]"
                  class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  routerLinkActive="active-nav-link"
                >
                  <span [innerHTML]="getIconHtml(item.icon)" class="w-5 h-5 flex-shrink-0 flex items-center justify-center"></span>
                  <span class="truncate">{{ item.labelKey | i18n }}</span>
                </a>
              }
            </nav>
          </div>
        </div>

        <!-- User Profile & Sign Out Footer -->
        @if (authService.isAuthenticated()) {
          <div class="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex-shrink-0">
            <div class="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs">
              <div class="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 uppercase shadow-xs">
                {{ (authService.user()?.email || 'U')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {{ authService.user()?.user_metadata?.['full_name'] || 'Owner' }}
                </p>
                <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight">
                  {{ authService.user()?.email }}
                </p>
              </div>
              <a
                routerLink="/settings"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Settings"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </a>
            </div>
            <button
              (click)="signOut()"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-rose-200 dark:border-rose-900/50 cursor-pointer"
              type="button"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{{ 'logout' | i18n }}</span>
            </button>
          </div>
        }
      </aside>
    }
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
      flex-shrink: 0;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .nav-link {
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .active-nav-link {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      font-weight: 700 !important;
      border: 1px solid #bfdbfe !important;
      border-left: 3.5px solid #2563eb !important;
      box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.06) !important;
    }

    [data-theme="dark"] .active-nav-link {
      background: rgba(37, 99, 235, 0.20) !important;
      color: #93c5fd !important;
      border-color: rgba(37, 99, 235, 0.40) !important;
      border-left-color: #60a5fa !important;
    }
  `],
})
export class AppSidebarComponent {
  sidebarService = inject(SidebarService);
  i18n = inject(I18nService);
  authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  mainNavItems: NavItem[] = [
    { labelKey: 'nav.dashboard', icon: 'dashboard', routerLink: '/dashboard' },
    { labelKey: 'nav.customers', icon: 'customers', routerLink: '/customers' },
    { labelKey: 'nav.collections', icon: 'collections', routerLink: '/collections' },
    { labelKey: 'nav.ledger', icon: 'ledger', routerLink: '/ledger' },
    { labelKey: 'nav.reports', icon: 'reports', routerLink: '/reports' },
  ];

  adminNavItems: NavItem[] = [
    { labelKey: 'nav.settings', icon: 'settings', routerLink: '/settings' },
  ];

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  getIconHtml(iconName: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l2-2m2-2v6m-2 2h6a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />`,
      customers: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m8 0h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6m8 0V10a2 2 0 00-2-2H9a2 2 0 00-2 2v8h12z" />`,
      collections: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      ledger: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
      reports: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
      settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />`,
    };
    return this.sanitizer.bypassSecurityTrustHtml(`<svg class="w-5 h-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">${icons[iconName] || ''}</svg>`);
  }
}
