import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../auth/auth.service';
import { I18nPipe } from './i18n.pipe';
import { filter } from 'rxjs';

interface TopNavLink {
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LanguageSwitcherComponent, I18nPipe],
  template: `
    <header class="fx-topbar sticky top-0 z-20 px-4 sm:px-6">
      <div class="fx-topbar-inner">
        <!-- Left: Sidebar Toggle & Breadcrumb -->
        <div class="fx-topbar-left">
          <button
            (click)="sidebarService.toggle()"
            class="fx-topbar-icon-btn"
            [attr.aria-label]="sidebarService.isOpen() ? 'Collapse navigation' : 'Expand navigation'"
            [attr.aria-expanded]="sidebarService.isOpen()"
            aria-controls="primary-navigation"
            type="button"
          >
            <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div class="hidden h-5 w-px bg-[var(--glass-border-subtle)] sm:block"></div>

          <div class="min-w-0">
            <p
              class="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] sm:block"
            >
              Finance Audit Pro
            </p>
            <p class="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {{ currentSection() }}
            </p>
          </div>
        </div>

        <!-- Center: Floating Pill Navigation Dock -->
        <nav class="fx-topbar-center hidden xl:flex" aria-label="Quick navigation">
          @for (item of quickLinks; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="fx-topbar-nav-pill"
            >
              {{ item.labelKey | i18n }}
            </a>
          }
        </nav>

        <!-- Right: Unified Language, Theme & Account Control Cluster -->
        <div class="fx-topbar-right">
          <div class="fx-topbar-controls">
            <app-language-switcher></app-language-switcher>

            <span class="fx-topbar-divider" aria-hidden="true"></span>

            <button
              (click)="toggleTheme()"
              class="fx-topbar-theme-btn"
              [attr.aria-label]="themeLabel()"
              [attr.title]="themeLabel()"
              type="button"
            >
              @if (isDarkMode()) {
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              } @else {
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              }
            </button>

            <span class="fx-topbar-divider" aria-hidden="true"></span>

            <a
              routerLink="/settings"
              class="fx-topbar-account"
              title="Account & Settings"
              aria-label="Account & Settings"
            >
              <span class="fx-topbar-avatar">{{ userInitial() }}</span>
              <span class="hidden md:inline truncate max-w-[110px] text-xs font-semibold">
                {{ userDisplayName() }}
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent {
  sidebarService = inject(SidebarService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  private router = inject(Router);

  currentSection = signal('Dashboard');
  isDarkMode = this.themeService.isDarkMode;

  readonly quickLinks: TopNavLink[] = [
    { labelKey: 'nav.dashboard', route: '/dashboard' },
    { labelKey: 'nav.customers', route: '/customers' },
    { labelKey: 'nav.villages', route: '/villages' },
    { labelKey: 'nav.collections', route: '/collections' },
    { labelKey: 'nav.ledger', route: '/ledger' },
    { labelKey: 'nav.reports', route: '/reports' },
  ];

  constructor() {
    this.updateCurrentSection(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigation = event as NavigationEnd;
        this.updateCurrentSection(navigation.urlAfterRedirects || navigation.url);
      });
  }

  userInitial(): string {
    return (this.authService.user()?.email || 'U').charAt(0).toUpperCase();
  }

  userDisplayName(): string {
    const user = this.authService.user();
    const fullName = user?.user_metadata?.['full_name'] as string | undefined;
    return fullName?.trim() || user?.email?.split('@')[0] || 'Account';
  }

  themeLabel(): string {
    return this.isDarkMode() ? 'Switch to light theme' : 'Switch to dark theme';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private updateCurrentSection(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    if (segments.length === 0 || segments[0] === 'dashboard') {
      this.currentSection.set('Dashboard');
      return;
    }
    const section = segments[0].replace(/-/g, ' ');
    this.currentSection.set(section.charAt(0).toUpperCase() + section.slice(1));
  }
}
