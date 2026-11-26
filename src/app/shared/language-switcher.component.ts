import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Language } from './i18n.service';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher relative inline-block text-left">
      <button
        (click)="toggleDropdown()"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent rounded-full hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] transition cursor-pointer"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen"
        type="button"
      >
        <span class="sr-only">Switch language</span>
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{{ currentLanguageName }}</span>
        <svg
          class="h-4 w-4 text-[var(--text-muted)] transition-transform duration-150"
          [class.rotate-180]="isOpen"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      @if (isOpen) {
        <div
          class="absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-[color-mix(in_srgb,var(--bg-secondary)_96%,transparent)] backdrop-blur-xl border border-[var(--glass-border-subtle)] overflow-hidden z-50 p-1"
          role="listbox"
        >
          @for (lang of availableLanguages; track lang.code) {
            <button
              type="button"
              (click)="selectLanguage(lang.code)"
              class="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors cursor-pointer"
              [class]="
                lang.code === currentLanguage
                  ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary-text)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-surface-hover)]'
              "
              [attr.aria-selected]="lang.code === currentLanguage"
              role="option"
            >
              <span>{{ lang.name }}</span>
              @if (lang.code === currentLanguage) {
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./language-switcher.component.css'],
})
export class LanguageSwitcherComponent {
  private readonly i18n = inject(I18nService);
  private readonly elementRef = inject(ElementRef);

  isOpen = false;
  availableLanguages = this.i18n.getAvailableLanguages();

  get currentLanguageName(): string {
    return this.i18n.language() === 'en' ? 'English' : 'తెలుగు';
  }

  get currentLanguage(): Language {
    return this.i18n.language();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: Language): void {
    this.i18n.changeLanguage(lang);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }
}
