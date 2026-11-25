import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly THEME_KEY = 'finance-audit-pro-theme';

  constructor() {
    this.initializeTheme();
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

    if (persist) globalThis.localStorage?.setItem(this.THEME_KEY, theme);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#101116' : '#f7f5f0');
  }
}
