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
        class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] bg-[#151F32] border border-[#263449] rounded-xl hover:bg-[#18243A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition cursor-pointer"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen"
        type="button"
      >
        <span class="sr-only">Switch language</span>
        <span class="w-4 h-4" [innerHTML]="currentLanguageIcon"></span>
        <span>{{ currentLanguageName }}</span>
        <svg
          class="h-4 w-4 text-[#64748B] transition-transform"
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
          class="absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-[#151F32] border border-[#263449] overflow-hidden z-50 p-1"
          role="listbox"
        >
          @for (lang of availableLanguages; track lang.code) {
            <button
              type="button"
              (click)="selectLanguage(lang.code)"
              class="flex items-center w-full px-3 py-2 text-xs font-medium text-left text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#18243A] rounded-lg transition-colors cursor-pointer"
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