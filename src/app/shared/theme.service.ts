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

  /**
   * Initialize theme from localStorage or default to light
   */
  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme === 'dark') {
      this.setDark();
    } else {
      this.setLight();
    }
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
  private setTheme(theme: 'light' | 'dark') {
    const htmlElement = this.document.documentElement;

    if (theme === 'dark') {
      htmlElement.dataset['theme'] = 'dark';
      htmlElement.classList.add('dark');
      localStorage.setItem(this.THEME_KEY, 'dark');
    } else {
      delete htmlElement.dataset['theme'];
      htmlElement.classList.remove('dark');
      localStorage.setItem(this.THEME_KEY, 'light');
    }
  }
}