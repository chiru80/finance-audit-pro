import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from './i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher relative inline-block text-left">
      <button
        (click)="toggleDropdown()"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary bg-background-secondary border border-border-light rounded-lg hover:bg-background-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen"
        type="button"
      >
        <span class="sr-only">Switch language</span>
        <span class="w-4 h-4" [innerHTML]="currentLanguageIcon"></span>
        <span>{{ currentLanguageName }}</span>
        <svg
          class="h-4 w-4 text-slate-400 transition-transform"
          [class.transform-180]="isOpen"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (isOpen) {
        <div
          class="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-background-primary border border-border-light ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="listbox"
        >
          @for (lang of availableLanguages; track lang.code) {
            <button
              type="button"
              (click)="selectLanguage(lang.code)"
              class="flex items-center w-full px-3 py-2 text-sm text-left text-text-secondary hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              [attr.aria-selected]="lang.code === currentLanguage"
              role="option"
            >
              <span class="w-4 h-4 mr-2" [innerHTML]="langIcon(lang.code)"></span>
              <span>{{ lang.name }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./language-switcher.component.css'],
})
export class LanguageSwitcherComponent {
  private i18n = inject(I18nService);

  isOpen = false;
  availableLanguages = this.i18n.getAvailableLanguages();

  get currentLanguageName(): string {
    return this.i18n.language() === 'en' ? 'English' : 'తెలుగు';
  }

  get currentLanguage(): Language {
    return this.i18n.language();
  }

  get currentLanguageIcon(): string {
    const lang = this.i18n.language();
    if (lang === 'en') {
      return '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />';
    }
    return '<path d="M9 18v-6h6v6H9zm0-8v6h6V10H9z" />';
  }

  langIcon(lang: Language): string {
    if (lang === 'en') {
      return '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />';
    }
    return '<path d="M9 18v-6h6v6H9zm0-8v6h6V10H9z" />';
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: Language): void {
    this.i18n.changeLanguage(lang);
    this.isOpen = false;
  }
}