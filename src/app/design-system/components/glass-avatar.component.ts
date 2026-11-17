import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type GlassAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type GlassAvatarShape = 'circle' | 'square' | 'rounded';

@Component({
  selector: 'glass-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="glass-avatar-root"
      [ngClass]="[sizeClasses, shapeClasses, variantClasses, interactiveClasses]"
      [title]="name || ''"
    >
      <!-- Specular Highlight -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      @if (src) {
        <img
          [src]="src"
          [alt]="name || 'Avatar'"
          class="glass-avatar-image"
        />
      } @else if (icon) {
        <div class="glass-avatar-icon" [innerHTML]="safeIcon"></div>
      } @else {
        <div class="glass-avatar-initials" [ngClass]="colorClasses">
          {{ getInitials(name) }}
        </div>
      }

      @if (status) {
        <span
          class="glass-avatar-status"
          [ngClass]="statusClasses"
        ></span>
      }

      @if (badge) {
        <span class="glass-avatar-badge" [ngClass]="badgeColorClasses">
          {{ badge }}
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .glass-avatar-root {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #151F32;
      border: 1px solid #263449;
      box-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.3);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .glass-avatar-root:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);
    }

    /* Image */
    .glass-avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Icon */
    .glass-avatar-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #38BDF8;
    }

    /* Initials */
    .glass-avatar-initials {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* Status Indicator */
    .glass-avatar-status {
      position: absolute;
      bottom: 0;
      right: 0;
      border: 2px solid #0B1120;
      border-radius: 50%;
    }

    /* Badge */
    .glass-avatar-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      border: 2px solid #0B1120;
      color: #F8FAFC;
      background: #EF4444;
    }

    /* Size Classes */
    .size-xs .glass-avatar-root { width: 24px; height: 24px; font-size: 0.625rem; }
    .size-xs .glass-avatar-status { width: 8px; height: 8px; }

    .size-sm .glass-avatar-root { width: 32px; height: 32px; font-size: 0.75rem; }
    .size-sm .glass-avatar-status { width: 10px; height: 10px; }

    .size-md .glass-avatar-root { width: 40px; height: 40px; font-size: 0.875rem; }
    .size-md .glass-avatar-status { width: 12px; height: 12px; }

    .size-lg .glass-avatar-root { width: 48px; height: 48px; font-size: 1rem; }
    .size-lg .glass-avatar-status { width: 14px; height: 14px; }

    .size-xl .glass-avatar-root { width: 64px; height: 64px; font-size: 1.25rem; }
    .size-xl .glass-avatar-status { width: 16px; height: 16px; }

    .size-2xl .glass-avatar-root { width: 80px; height: 80px; font-size: 1.5rem; }
    .size-2xl .glass-avatar-status { width: 20px; height: 20px; }

    /* Shape Classes */
    .shape-circle .glass-avatar-root { border-radius: 50%; }
    .shape-square .glass-avatar-root { border-radius: 4px; }
    .shape-rounded .glass-avatar-root { border-radius: 12px; }

    .shape-circle .glass-avatar-status { bottom: 2px; right: 2px; }
    .shape-square .glass-avatar-status { bottom: 2px; right: 2px; border-radius: 4px; }
    .shape-rounded .glass-avatar-status { bottom: 2px; right: 2px; border-radius: 12px; }

    /* Variant Classes */
    .variant-default .glass-avatar-root {
      background: #151F32;
      border-color: #263449;
    }

    .variant-gradient .glass-avatar-root {
      background: linear-gradient(135deg, #2563EB, #7C3AED);
      border-color: transparent;
    }

    .variant-gradient-blue .glass-avatar-root {
      background: linear-gradient(135deg, #2563EB, #3B82F6);
      border-color: transparent;
    }

    .variant-gradient-purple .glass-avatar-root {
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      border-color: transparent;
    }

    .variant-gradient-emerald .glass-avatar-root {
      background: linear-gradient(135deg, #10B981, #34D399);
      border-color: transparent;
    }

    .variant-gradient-amber .glass-avatar-root {
      background: linear-gradient(135deg, #F59E0B, #FBBF24);
      border-color: transparent;
    }

    .variant-gradient-rose .glass-avatar-root {
      background: linear-gradient(135deg, #EF4444, #F87171);
      border-color: transparent;
    }

    .variant-ring .glass-avatar-root {
      background: #151F32;
      border-width: 2px;
    }

    /* Color Classes for Initials */
    .color-blue .glass-avatar-initials {
      background: linear-gradient(135deg, #2563EB, #3B82F6);
      color: #FFFFFF;
    }
    .color-indigo .glass-avatar-initials {
      background: linear-gradient(135deg, #4F46E5, #6366F1);
      color: #FFFFFF;
    }
    .color-purple .glass-avatar-initials {
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: #FFFFFF;
    }
    .color-pink .glass-avatar-initials {
      background: linear-gradient(135deg, #EC4899, #F472B6);
      color: #FFFFFF;
    }
    .color-red .glass-avatar-initials {
      background: linear-gradient(135deg, #EF4444, #F87171);
      color: #FFFFFF;
    }
    .color-orange .glass-avatar-initials {
      background: linear-gradient(135deg, #F97316, #FB923C);
      color: #FFFFFF;
    }
    .color-amber .glass-avatar-initials {
      background: linear-gradient(135deg, #F59E0B, #FBBF24);
      color: #FFFFFF;
    }
    .color-yellow .glass-avatar-initials {
      background: linear-gradient(135deg, #EAB308, #FACC15);
      color: #0B1120;
    }
    .color-lime .glass-avatar-initials {
      background: linear-gradient(135deg, #84CC16, #A3E635);
      color: #0B1120;
    }
    .color-green .glass-avatar-initials {
      background: linear-gradient(135deg, #22C55E, #4ADE80);
      color: #FFFFFF;
    }
    .color-emerald .glass-avatar-initials {
      background: linear-gradient(135deg, #10B981, #34D399);
      color: #FFFFFF;
    }
    .color-teal .glass-avatar-initials {
      background: linear-gradient(135deg, #14B8A6, #2DD4BF);
      color: #FFFFFF;
    }
    .color-cyan .glass-avatar-initials {
      background: linear-gradient(135deg, #06B6D4, #22D3EE);
      color: #FFFFFF;
    }
    .color-sky .glass-avatar-initials {
      background: linear-gradient(135deg, #0EA5E9, #38BDF8);
      color: #FFFFFF;
    }
    .color-slate .glass-avatar-initials {
      background: linear-gradient(135deg, #475569, #64748B);
      color: #FFFFFF;
    }
    .color-gray .glass-avatar-initials {
      background: linear-gradient(135deg, #737373, #A3A3A3);
      color: #FFFFFF;
    }
    .color-zinc .glass-avatar-initials {
      background: linear-gradient(135deg, #525252, #737373);
      color: #FFFFFF;
    }
    .color-neutral .glass-avatar-initials {
      background: linear-gradient(135deg, #525252, #737373);
      color: #FFFFFF;
    }
    .color-stone .glass-avatar-initials {
      background: linear-gradient(135deg, #57534E, #78716C);
      color: #FFFFFF;
    }

    /* Status Classes */
    .status-online { background: #10B981; }
    .status-offline { background: #64748B; }
    .status-busy { background: #EF4444; }
    .status-away { background: #F59E0B; }
    .status-dnd { background: #8B5CF6; }

    /* Badge Color Classes */
    .badge-default { background: #2563EB; }
    .badge-primary { background: #2563EB; }
    .badge-success { background: #10B981; }
    .badge-warning { background: #F59E0B; }
    .badge-danger { background: #EF4444; }
    .badge-info { background: #38BDF8; }

    /* Interactive */
    .interactive-true {
      cursor: pointer;
    }

    .interactive-true:hover {
      transform: scale(1.05);
    }
  `],
})
export class GlassAvatarComponent {
  @Input() src = '';
  @Input() name = '';
  @Input() icon = '';
  @Input() size: GlassAvatarSize = 'md';
  @Input() shape: GlassAvatarShape = 'circle';
  @Input() variant: 'default' | 'gradient' | 'gradient-blue' | 'gradient-purple' | 'gradient-emerald' | 'gradient-amber' | 'gradient-rose' | 'ring' = 'default';
  @Input() color: string = 'blue';
  @Input() status: 'online' | 'offline' | 'busy' | 'away' | 'dnd' | '' = '';
  @Input() badge = '';
  @Input() badgeColor: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() interactive = false;

  private sanitizer = inject(DomSanitizer);

  get sizeClasses(): string {
    return `size-${this.size}`;
  }

  get shapeClasses(): string {
    return `shape-${this.shape}`;
  }

  get variantClasses(): string {
    return `variant-${this.variant}`;
  }

  get colorClasses(): string {
    return `color-${this.color}`;
  }

  get statusClasses(): string {
    return `status-${this.status}`;
  }

  get badgeColorClasses(): string {
    return `badge-${this.badgeColor}`;
  }

  get interactiveClasses(): string {
    return this.interactive ? 'interactive-true' : 'interactive-false';
  }

  get safeIcon(): SafeHtml {
    if (!this.icon) return '';
    const svgStr = this.icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}