import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassCardVariant = 'default' | 'elevated' | 'subtle' | 'kpi';
export type GlassCardGlow = 'accent' | 'success' | 'warning' | 'none';

@Component({
  selector: 'glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="glass-card-root rounded-2xl transition-all duration-200 relative overflow-hidden"
      [ngClass]="[surfaceClasses, glowClasses, interactiveClasses, customClass]"
    >
      <!-- Specular Refraction Highlight Line (uses design token --glass-specular-top) -->
      <div class="glass-specular-top pointer-events-none absolute inset-x-0 top-0 h-[1px]"></div>

      <!-- Content Projection -->
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .glass-card-root {
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Map variants to design system tokens directly */
    .surface-default {
      background: var(--glass-surface-base);
      backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
      color: var(--text-primary);
    }

    .surface-elevated {
      background: var(--glass-surface-elevated);
      backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-crisp);
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim), var(--glass-specular-highlight);
      color: var(--text-primary);
    }

    .surface-elevated::before {
      content: '';
      position: absolute;
      inset-x: 0;
      top: 0;
      height: 1px;
      pointer-events: none;
      box-shadow: var(--glass-specular-top);
    }

    .surface-subtle {
      background: var(--glass-surface-muted);
      backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-sm), var(--glass-specular-top);
      color: var(--text-secondary);
    }

    .surface-kpi {
      background: var(--glass-surface-base);
      backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border-subtle);
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
      color: var(--text-primary);
    }

    .card-interactive:hover {
      transform: translateY(-2px);
      border-color: var(--primary-accent);
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
    }

    .glow-accent {
      box-shadow: var(--glass-shadow-glow-accent);
    }

    .glow-success {
      box-shadow: var(--glass-shadow-glow-success);
    }

    .glow-warning {
      box-shadow: var(--glass-shadow-glow-warning);
    }
  `],
})
export class GlassCardComponent {
  @Input() variant: GlassCardVariant = 'default';
  @Input() glow: GlassCardGlow = 'none';
  @Input() interactive = false;
  @Input() customClass = '';

  get surfaceClasses(): string {
    return `surface-${this.variant}`;
  }

  get glowClasses(): string {
    return this.glow !== 'none' ? `glow-${this.glow}` : '';
  }

  get interactiveClasses(): string {
    return this.interactive ? 'card-interactive cursor-pointer' : '';
  }
}
