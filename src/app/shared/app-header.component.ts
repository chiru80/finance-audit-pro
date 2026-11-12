import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LanguageSwitcherComponent],
  template: `
    <header class="header h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200/80 shadow-xs flex-shrink-0">
      <div class="header-left flex items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          aria-label="Toggle navigation"
          type="button"
        >
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Weekly Collections</span>
          <span>/</span>
          <span class="text-slate-700 font-semibold">Active Session</span>
        </div>
      </div>

      <div class="header-right flex items-center gap-3">
        <app-language-switcher></app-language-switcher>

        <button
          (click)="toggleTheme()"
          class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
        >
          @if (themeService.isDark()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-yellow-500"
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
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent {
  themeService = inject(ThemeService);
  sidebarService = inject(SidebarService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}