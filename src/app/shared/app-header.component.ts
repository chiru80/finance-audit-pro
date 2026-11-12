import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LanguageSwitcherComponent],
  template: `
    <header class="header flex items-center justify-between px-4 py-3 bg-background-primary border-b border-border-light shadow-sm">
      <div class="header-left flex items-center gap-3">
        <button
          (click)="sidebarService.toggle()"
          class="p-2 rounded-lg hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <h1 class="text-lg font-semibold text-text-primary">Finance Audit Pro</h1>
      </div>

      <div class="header-right flex items-center gap-4">
        <app-language-switcher></app-language-switcher>

        <button
          (click)="toggleTheme()"
          class="p-2 rounded-lg hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
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