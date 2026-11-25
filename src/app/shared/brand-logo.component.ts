import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="fx-brand-svg flex-shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fa-bg" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1E1F26" />
          <stop offset="55%" stop-color="#131419" />
          <stop offset="100%" stop-color="#29241B" />
        </linearGradient>
        <linearGradient id="fa-gold" x1="8" y1="30" x2="32" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#B08D57" />
          <stop offset="50%" stop-color="#DFC99C" />
          <stop offset="100%" stop-color="#FFF5DF" />
        </linearGradient>
        <linearGradient id="fa-ring" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E8D6B3" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#A78B59" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#E8D6B3" stop-opacity="0.6" />
        </linearGradient>
      </defs>

      <!-- Obsidian squircle badge -->
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#fa-bg)" />
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="11"
        stroke="url(#fa-ring)"
        stroke-width="1.25"
      />
      <!-- Top specular rim -->
      <path
        d="M12 2.25H28"
        stroke="#FFF8EA"
        stroke-opacity="0.35"
        stroke-width="0.9"
        stroke-linecap="round"
      />

      <!-- Ascending ledger bars -->
      <rect x="10.5" y="21.5" width="3.2" height="7.5" rx="1.2" fill="url(#fa-gold)" fill-opacity="0.45" />
      <rect x="16.4" y="17.5" width="3.2" height="11.5" rx="1.2" fill="url(#fa-gold)" fill-opacity="0.72" />
      <rect x="22.3" y="13.5" width="3.2" height="15.5" rx="1.2" fill="url(#fa-gold)" />

      <!-- Precision audit verification arc -->
      <path
        d="M9.5 18.5L15.8 13.8L20.5 16.5L29.5 10.5"
        stroke="url(#fa-gold)"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Apex beacon dot -->
      <circle cx="29.5" cy="10.5" r="2.1" fill="#FFF6E2" />
      <circle cx="29.5" cy="10.5" r="3.8" fill="#DFC99C" fill-opacity="0.22" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .fx-brand-svg {
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.22));
        transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      :host:hover .fx-brand-svg {
        transform: scale(1.04);
      }
    `,
  ],
})
export class BrandLogoComponent {
  @Input() size = 38;
}
