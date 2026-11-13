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
    <header class="header sticky top-0 h-16 flex items-center justify-between px-4 sm:px-6 bg-[#111827] border-b border-[#263449] flex-shrink-0 z-20 select-none">
      <!-- Left: Sidebar Toggle & Dynamic Breadcrumb -->
      <div class="header-left flex items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05] border border-[#263449] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition cursor-pointer"
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
          <span class="text-[#64748B] hidden sm:inline">Finance Audit Pro</span>
          <span class="text-[#263449] hidden sm:inline">/</span>
          <span class="px-2.5 py-1 rounded-lg bg-[#18243A] text-[#38BDF8] font-semibold border border-[#263449] capitalize">
            {{ currentSection }}
          </span>
        </div>
      </div>

      <!-- Right: Status, Language, Notifications, Avatar -->
      <div class="header-right flex items-center gap-2 sm:gap-3">
        <!-- Live Status Pill -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold border border-[#10B981]/20">
          <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>Live Sync</span>
        </div>

        <app-language-switcher></app-language-switcher>

        <!-- Notification Bell -->
        <button
          type="button"
          class="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] bg-[#151F32] border border-[#263449] hover:bg-[#18243A] transition cursor-pointer relative"
          title="Notifications"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-[#111827]"></span>
        </button>

        <!-- User Quick Avatar -->
        <div class="w-8 h-8 rounded-lg bg-[#2563EB] text-[#F8FAFC] font-bold text-xs flex items-center justify-center uppercase shadow-xs border border-blue-400/30">
          {{ (authService.user()?.email || 'U')[0] }}
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

  currentSection = 'Dashboard';

  constructor() {
    this.updateCurrentSection(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateCurrentSection(event.urlAfterRedirects || event.url);
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private updateCurrentSection(url: string) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    if (segments.length === 0 || segments[0] === 'dashboard') {
      this.currentSection = 'Dashboard';
    } else {
      this.currentSection = segments[0].replace('-', ' ');
    }
  }
}
