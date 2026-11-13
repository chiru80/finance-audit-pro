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
      class="glass-card-root rounded-2xl transition-all duration-300 relative overflow-hidden"
      [ngClass]="[variantClasses, glowClasses, interactiveClasses, customClass]"
    >
      <!-- Specular Refraction Highlight Line -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent"></div>
      
      <!-- Content Projection -->
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .glass-card-root {
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
    }

    .glass-card-default {
      background: var(--glass-surface-base, rgba(255, 255, 255, 0.78));
      backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    .glass-card-elevated {
      background: var(--glass-surface-elevated, rgba(255, 255, 255, 0.88));
      backdrop-filter: blur(var(--glass-blur-lg, 32px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-lg, 32px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-crisp, rgba(255, 255, 255, 0.85));
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
    }

    .glass-card-subtle {
      background: var(--glass-surface-muted, rgba(255, 255, 255, 0.55));
      backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-sm, 12px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: var(--glass-shadow-sm), var(--glass-specular-top);
    }

    .glass-card-kpi {
      background: var(--glass-surface-base, rgba(255, 255, 255, 0.78));
      backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      -webkit-backdrop-filter: blur(var(--glass-blur-md, 20px)) saturate(var(--glass-saturate, 185%));
      border: 1px solid var(--glass-border-subtle, rgba(226, 232, 240, 0.75));
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
    }

    .glass-card-interactive:hover {
      transform: translateY(-2px) var(--glass-scale-hover, scale(1.012));
      box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
    }

    .glow-accent {
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim), var(--glass-shadow-glow-accent);
    }

    .glow-success {
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim), var(--glass-shadow-glow-success);
    }

    .glow-warning {
      box-shadow: var(--glass-shadow-md), var(--glass-specular-rim), var(--glass-shadow-glow-warning);
    }
  `],
})
export class GlassCardComponent {
  @Input() variant: GlassCardVariant = 'default';
  @Input() interactive = false;
  @Input() glowColor: GlassCardGlow = 'none';
  @Input() customClass = '';

  get variantClasses(): string {
    switch (this.variant) {
      case 'elevated':
        return 'glass-card-elevated';
      case 'subtle':
        return 'glass-card-subtle';
      case 'kpi':
        return 'glass-card-kpi';
      case 'default':
      default:
        return 'glass-card-default';
    }
  }

  get glowClasses(): string {
    switch (this.glowColor) {
      case 'accent':
        return 'glow-accent';
      case 'success':
        return 'glow-success';
      case 'warning':
        return 'glow-warning';
      case 'none':
      default:
        return '';
    }
  }

  get interactiveClasses(): string {
    return this.interactive ? 'glass-card-interactive cursor-pointer' : '';
  }
}
