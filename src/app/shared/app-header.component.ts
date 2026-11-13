import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  template: `
    <header class="header h-16 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800 shadow-xs flex-shrink-0 relative z-20 select-none">
      <!-- Specular Refraction Line on Top of Header -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

      <!-- Left: Sidebar Toggle & Dynamic Breadcrumb -->
      <div class="header-left flex items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition cursor-pointer"
          aria-label="Toggle navigation"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div class="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <span class="text-slate-400 dark:text-slate-500 hidden sm:inline">Audit Engine</span>
          <span class="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/60 capitalize">
            {{ currentSection }}
          </span>
        </div>
      </div>

      <!-- Right: Language, Notifications, Theme, Profile -->
      <div class="header-right flex items-center gap-2 sm:gap-3">
        <!-- Live Status Pill -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/60">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Live Sync</span>
        </div>

        <app-language-switcher></app-language-switcher>

        <!-- Notification Bell -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer relative"
          title="Notifications"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        <!-- Theme Switcher -->
        <button
          (click)="toggleTheme()"
          class="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 focus:outline-none transition cursor-pointer"
          [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
        >
          @if (themeService.isDark()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m8.66-12.66l-.71.71M5.05 5.05l-.71.71M18 12h-1M5 12H4m15.66 5.66l-.71-.71M6.34 6.34l-.71-.71"
              />
            </svg>
          } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-slate-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          }
        </button>

        <!-- User Quick Avatar -->
        @if (authService.isAuthenticated()) {
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs border border-white/40">
            {{ (authService.user()?.email || 'U')[0] }}
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class AppHeaderComponent {
  themeService = inject(ThemeService);
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);
  private router = inject(Router);

  currentSection = 'Dashboard';

  constructor() {
    this.updateCurrentSection(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.updateCurrentSection(e.urlAfterRedirects || e.url);
    });
  }

  private updateCurrentSection(url: string) {
    const cleanUrl = url.split('?')[0].split('/')[1] || 'Dashboard';
    this.currentSection = cleanUrl.charAt(0).toUpperCase() + cleanUrl.slice(1);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
