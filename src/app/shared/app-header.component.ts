import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LanguageSwitcherComponent],
  template: `
    <header
      class="fx-topbar sticky top-0 z-20 flex h-[72px] flex-shrink-0 items-center justify-between gap-4 border-b border-[var(--glass-border-subtle)] bg-[var(--bg-topbar)] px-4 sm:px-7"
    >
      <div class="flex min-w-0 items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-base)] text-[var(--text-secondary)] transition-colors hover:border-[var(--glass-border-crisp)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
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
            Workspace
          </p>
          <p class="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {{ currentSection() }}
          </p>
        </div>
      </div>

      <div class="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        <app-language-switcher></app-language-switcher>

        <button
          (click)="toggleTheme()"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-base)] text-[var(--text-secondary)] transition-colors hover:border-[var(--glass-border-crisp)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
          [attr.aria-label]="themeLabel()"
          [attr.title]="themeLabel()"
          type="button"
        >
          @if (isDarkMode()) {
            <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
          } @else {
            <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              />
            </svg>
          }
        </button>

        <a
          routerLink="/settings"
          class="ml-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-sidebar)] text-sm font-semibold uppercase text-white ring-2 ring-[var(--bg-topbar)] shadow-[var(--glass-shadow-sm)] transition-transform hover:scale-[1.03]"
          title="Settings"
          aria-label="Settings"
        >
          {{ userInitial() }}
        </a>
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
  isDarkMode = signal(this.themeService.isDark());

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

  themeLabel(): string {
    return this.isDarkMode() ? 'Switch to light theme' : 'Switch to dark theme';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode.set(this.themeService.isDark());
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
