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
      [ngClass]="[variantClasses, glowClasses, interactiveClasses, customClass]"
    >
      <!-- Specular Refraction Highlight Line -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
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

    .glass-card-default {
      background: #151F32;
      border: 1px solid #263449;
      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.45);
      color: #F8FAFC;
    }

    .glass-card-elevated {
      background: #18243A;
      border: 1px solid #263449;
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.55);
      color: #F8FAFC;
    }

    .glass-card-subtle {
      background: #111827;
      border: 1px solid #263449;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.35);
      color: #94A3B8;
    }

    .glass-card-kpi {
      background: #151F32;
      border: 1px solid #263449;
      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.45);
      color: #F8FAFC;
    }

    .card-interactive:hover {
      transform: translateY(-2px);
      border-color: #3B82F6;
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.60);
    }

    .glow-accent {
      box-shadow: 0 0 20px rgba(37, 99, 235, 0.25);
    }

    .glow-success {
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
    }

    .glow-warning {
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);
    }
  `],
})
export class GlassCardComponent {
  @Input() variant: GlassCardVariant = 'default';
  @Input() glow: GlassCardGlow = 'none';
  @Input() interactive = false;
  @Input() customClass = '';

  get variantClasses(): string {
    return `glass-card-${this.variant}`;
  }

  get glowClasses(): string {
    return this.glow !== 'none' ? `glow-${this.glow}` : '';
  }

  get interactiveClasses(): string {
    return this.interactive ? 'card-interactive cursor-pointer' : '';
  }
}
