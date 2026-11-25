import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { SidebarService } from './sidebar.service';
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
  host: {
    '[class.is-collapsed]': '!sidebarService.isOpen()',
  },
  template: `
    <aside
      id="primary-navigation"
      class="fx-sidebar flex h-full w-[264px] flex-col border-r border-[var(--glass-border-subtle)] bg-[var(--bg-sidebar)]"
      [class.fx-sidebar--open]="sidebarService.isOpen()"
      [attr.aria-hidden]="sidebarService.isOpen() ? null : 'true'"
      [attr.inert]="sidebarService.isOpen() ? null : ''"
    >
      <!-- Brand -->
      <div
        class="flex h-16 flex-shrink-0 items-center gap-3 border-b border-[var(--glass-border-subtle)] px-5"
      >
        <span class="fx-brand-mark" aria-hidden="true">FA</span>
        <div class="min-w-0">
          <p class="truncate text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
            Finance Audit Pro
          </p>
          <p
            class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-text)]"
          >
            FINANCE · AUDIT
          </p>
        </div>
      </div>

      <!-- Navigation -->
      <nav aria-label="Primary navigation" class="fx-sidebar-nav flex-1 overflow-y-auto px-3 py-5">
        <p class="fx-nav-label">Workspace</p>
        <div class="mb-6 space-y-0.5">
          @for (item of mainNavItems; track item.routerLink) {
            <a
              [routerLink]="[item.routerLink]"
              class="fx-nav-link"
              routerLinkActive="is-active"
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="{ exact: item.routerLink === '/dashboard' }"
            >
              <span class="fx-nav-icon" [innerHTML]="getIconHtml(item.icon)"></span>
              <span class="truncate">{{ item.labelKey | i18n }}</span>
            </a>
          }
        </div>

        <a routerLink="/collections" class="fx-nav-quick">
          <span aria-hidden="true">+</span>
          <span>Record a collection</span>
        </a>

        <p class="fx-nav-label">Account</p>
        <div class="space-y-0.5">
          @for (item of adminNavItems; track item.routerLink) {
            <a [routerLink]="[item.routerLink]" class="fx-nav-link" routerLinkActive="is-active">
              <span class="fx-nav-icon" [innerHTML]="getIconHtml(item.icon)"></span>
              <span class="truncate">{{ item.labelKey | i18n }}</span>
            </a>
          }
        </div>
      </nav>

      <!-- Account footer -->
      @if (authService.isAuthenticated()) {
        <div class="flex-shrink-0 border-t border-[var(--glass-border-subtle)] p-3">
          <div
            class="flex items-center gap-3 rounded-[10px] border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-muted)] p-2.5"
          >
            <span
              class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-tint)] text-xs font-bold uppercase text-[var(--color-primary-text)] ring-1 ring-inset ring-[var(--color-primary-border)]"
            >
              {{ userInitial() }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold leading-tight text-[var(--text-primary)]">
                {{ authService.user()?.user_metadata?.['full_name'] || 'Partner' }}
              </p>
              <p class="mt-0.5 truncate text-[11px] leading-tight text-[var(--text-muted)]">
                {{ authService.user()?.email }}
              </p>
            </div>
            <a
              routerLink="/settings"
              class="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
              title="Settings"
              aria-label="Settings"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </a>
          </div>

          <button type="button" (click)="signOut()" class="fx-signout mt-2">
            <svg
              class="h-4 w-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{{ 'logout' | i18n }}</span>
          </button>
        </div>
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 264px;
        height: 100%;
        flex-shrink: 0;
        overflow: hidden;
        transition: width var(--glass-transition-normal);
      }

      :host(.is-collapsed) {
        width: 0;
      }

      .fx-sidebar {
        width: 264px;
        background: var(--bg-sidebar);
        border-color: var(--glass-border-subtle);
        transition: transform var(--glass-transition-normal);
      }

      .fx-brand-mark {
        display: inline-flex;
        width: 2.25rem;
        height: 2.25rem;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-primary-border);
        border-radius: 11px;
        background: var(--gradient-ivory-gold);
        color: var(--brand-obsidian);
        font-family: var(--font-display);
        font-size: 1.35rem;
        line-height: 1;
        box-shadow: 0 5px 16px -8px rgba(0, 0, 0, 0.45);
      }

      .fx-sidebar p {
        color: var(--text-primary);
      }

      .fx-sidebar .fx-nav-label {
        color: var(--text-muted);
      }

      .fx-sidebar .fx-nav-link {
        color: var(--text-secondary);
      }

      .fx-sidebar .fx-nav-link:hover {
        background: var(--color-surface-hover);
        color: var(--text-primary);
      }

      .fx-sidebar .fx-nav-link.is-active {
        border-color: var(--color-primary-border);
        background: var(--color-primary-tint);
        color: var(--color-primary-text);
      }

      .fx-nav-quick {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-height: 2.75rem;
        margin: 0.75rem 0 1.5rem;
        padding: 0 0.8rem;
        border: 1px solid var(--color-primary-border);
        border-radius: 10px;
        background: var(--primary-accent);
        color: var(--color-on-primary);
        font-size: 0.78rem;
        font-weight: 700;
        text-decoration: none;
        transition:
          background-color var(--glass-transition-fast),
          transform var(--glass-transition-fast);
      }

      .fx-nav-quick:hover {
        background: var(--primary-hover);
        transform: translateY(-1px);
      }

      .fx-nav-quick span:first-child {
        display: grid;
        width: 1.4rem;
        height: 1.4rem;
        place-items: center;
        border: 1px solid rgba(23, 60, 48, 0.22);
        border-radius: 7px;
        font-size: 1.1rem;
        line-height: 1;
      }

      .fx-nav-label {
        margin: 0 0 0.5rem;
        padding-inline: 0.75rem;
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .fx-nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        height: 2.625rem;
        padding-inline: 0.75rem;
        border-radius: 9px;
        border: 1px solid transparent;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        font-weight: 500;
        transition:
          background-color var(--glass-transition-fast),
          border-color var(--glass-transition-fast),
          color var(--glass-transition-fast);
      }

      .fx-nav-link:hover {
        background: var(--color-surface-hover);
        color: var(--text-primary);
      }

      .fx-nav-link.is-active {
        background: var(--color-primary-tint);
        border-color: var(--color-primary-border);
        color: var(--color-primary-text);
        font-weight: 600;
      }

      .fx-nav-icon {
        display: inline-flex;
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
      }

      .fx-signout {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        height: 2.25rem;
        border-radius: 9px;
        border: 1px solid var(--glass-border-subtle);
        background: transparent;
        color: var(--color-danger-text);
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background-color var(--glass-transition-fast),
          border-color var(--glass-transition-fast);
      }

      .fx-signout:hover {
        background: var(--color-danger-tint);
        border-color: var(--color-danger-border);
      }

      @media (max-width: 1023px) {
        :host,
        :host(.is-collapsed) {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 40;
          width: 264px;
          transform: translateX(0);
          transition: transform var(--glass-transition-normal);
        }

        :host(.is-collapsed) {
          transform: translateX(-100%);
        }
      }
    `,
  ],
})
export class AppSidebarComponent {
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        this.sidebarService.close();
      }
    });
  }

  mainNavItems: NavItem[] = [
    { labelKey: 'nav.dashboard', icon: 'dashboard', routerLink: '/dashboard' },
    { labelKey: 'nav.customers', icon: 'customers', routerLink: '/customers' },
    { labelKey: 'nav.collections', icon: 'collections', routerLink: '/collections' },
    { labelKey: 'nav.ledger', icon: 'ledger', routerLink: '/ledger' },
    { labelKey: 'nav.reports', icon: 'reports', routerLink: '/reports' },
    { labelKey: 'nav.onlinePayments', icon: 'payments', routerLink: '/online-payments' },
    { labelKey: 'nav.auditLog', icon: 'audit', routerLink: '/audit-log' },
    { labelKey: 'nav.outbox', icon: 'outbox', routerLink: '/outbox' },
  ];

  adminNavItems: NavItem[] = [
    { labelKey: 'nav.settings', icon: 'settings', routerLink: '/settings' },
  ];

  userInitial(): string {
    return (this.authService.user()?.email || 'U').charAt(0).toUpperCase();
  }

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  getIconHtml(iconName: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />`,
      customers: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20m16 0v-1.5a3.5 3.5 0 00-2.7-3.397M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />`,
      collections: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      ledger: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
      reports: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
      payments: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.25 8.25h19.5m-16.5 0V6A2.25 2.25 0 017.5 3.75h9A2.25 2.25 0 0118.75 6v2.25m-13.5 0v9.75A2.25 2.25 0 007.5 20.25h9a2.25 2.25 0 002.25-2.25V8.25m-12 5.25h4.5" />`,
      audit: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      outbox: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8.25l9 5.25 9-5.25M4.5 6h15A1.5 1.5 0 0121 7.5v10.125A2.625 2.625 0 0118.375 20.25H5.625A2.625 2.625 0 013 17.625V7.5A1.5 1.5 0 014.5 6z" />`,
      settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />`,
    };
    const icon = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">${icon}</svg>`,
    );
  }
}
