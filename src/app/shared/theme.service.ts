import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly THEME_KEY = 'finance-audit-pro-theme';

  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
    this.watchSystemTheme();
  }

  /** Use an explicit preference when present, otherwise follow the system theme. */
  private initializeTheme() {
    const savedTheme = globalThis.localStorage?.getItem(this.THEME_KEY);
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.setTheme(
      savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark) ? 'dark' : 'light',
      false,
    );
  }

  /** Automatically follow OS/browser theme changes when user has not set an explicit preference. */
  private watchSystemTheme() {
    const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery?.addEventListener) return;

    mediaQuery.addEventListener('change', (event) => {
      const savedTheme = globalThis.localStorage?.getItem(this.THEME_KEY);
      if (!savedTheme) {
        this.setTheme(event.matches ? 'dark' : 'light', false);
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    if (this.isDark()) {
      this.setLight();
    } else {
      this.setDark();
    }
  }

  /**
   * Set dark theme
   */
  setDark() {
    this.setTheme('dark');
  }

  /**
   * Set light theme
   */
  setLight() {
    this.setTheme('light');
  }

  /**
   * Check if dark theme is active
   */
  isDark(): boolean {
    return this.document.documentElement.dataset['theme'] === 'dark';
  }

  /**
   * Apply theme by setting data attribute on html element
   */
  private setTheme(theme: 'light' | 'dark', persist = true) {
    const htmlElement = this.document.documentElement;

    if (theme === 'dark') {
      htmlElement.dataset['theme'] = 'dark';
      htmlElement.classList.add('dark');
    } else {
      delete htmlElement.dataset['theme'];
      htmlElement.classList.remove('dark');
    }

    this.isDarkMode.set(theme === 'dark');

    if (persist) globalThis.localStorage?.setItem(this.THEME_KEY, theme);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#101116' : '#f7f5f0');
  }
}
