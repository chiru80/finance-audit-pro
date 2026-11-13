import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  template: `
    <header class="header h-16 flex items-center justify-between px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs flex-shrink-0 relative z-10 select-none">
      <!-- Specular Refraction Line on Top of Header -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent"></div>

      <div class="header-left flex items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition cursor-pointer"
          aria-label="Toggle navigation"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-slate-600 dark:text-slate-300"
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

        <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-400 font-medium backdrop-blur-sm shadow-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-slate-500 dark:text-slate-400">Weekly Collections</span>
          <span class="text-slate-300 dark:text-slate-600">/</span>
          <span class="text-slate-800 dark:text-slate-200 font-semibold">Active Session</span>
        </div>
      </div>

      <div class="header-right flex items-center gap-3">
        <app-language-switcher></app-language-switcher>

        <button
          (click)="toggleTheme()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs transition cursor-pointer"
          [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
        >
          @if (themeService.isDark()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-400"
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
              class="h-5 w-5 text-slate-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          }
        </button>
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

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
