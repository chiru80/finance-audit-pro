import { Component, inject } from '@angular/core';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-rupee-loader',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="rupee-loader-overlay" role="status" aria-live="polite" aria-label="Loading">
        <div class="rupee-loader">
          <div class="rupee-coin-wrap">
            <div class="rupee-coin">
              <span class="rupee-glyph">₹</span>
              <span class="rupee-shine"></span>
            </div>
            <div class="rupee-glow"></div>
          </div>
          <div class="rupee-brand">
            <span class="rupee-brand-name">Weekly Finance</span>
            <span class="rupee-brand-sub">Loading your workspace</span>
          </div>
          <div class="rupee-progress">
            <span class="rupee-progress-bar"></span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .rupee-loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(
          ellipse 80% 60% at 50% 40%,
          var(--color-primary-tint) 0%,
          var(--bg-primary) 70%
        );
        backdrop-filter: blur(6px);
        animation: rupee-overlay-in 0.25s ease-out;
      }
      .rupee-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }
      .rupee-coin-wrap {
        position: relative;
        width: 7rem;
        height: 7rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rupee-coin {
        position: relative;
        width: 6rem;
        height: 6rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary-hover), var(--primary-accent));
        box-shadow:
          0 12px 32px var(--color-primary-tint),
          inset 0 2px 6px rgba(255, 255, 255, 0.25),
          inset 0 -4px 8px rgba(0, 0, 0, 0.25);
        animation: rupee-coin-flip 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-style: preserve-3d;
        overflow: hidden;
      }
      .rupee-glyph {
        font-size: 2.75rem;
        font-weight: 800;
        line-height: 1;
        color: var(--color-on-primary);
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 2;
      }
      .rupee-shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          115deg,
          transparent 35%,
          rgba(255, 255, 255, 0.45) 50%,
          transparent 65%
        );
        animation: rupee-shine-sweep 1.6s ease-in-out infinite;
        z-index: 3;
      }
      .rupee-glow {
        position: absolute;
        inset: -0.75rem;
        border-radius: 50%;
        background: radial-gradient(circle, var(--color-primary-tint) 0%, transparent 70%);
        animation: rupee-glow-pulse 1.6s ease-in-out infinite;
        z-index: -1;
      }
      .rupee-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }
      .rupee-brand-name {
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--text-primary);
      }
      .rupee-brand-sub {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .rupee-progress {
        width: 8rem;
        height: 3px;
        border-radius: 9999px;
        background: var(--glass-border-subtle);
        overflow: hidden;
      }
      .rupee-progress-bar {
        display: block;
        height: 100%;
        width: 40%;
        border-radius: 9999px;
        background: var(--primary-accent);
        animation: rupee-progress-slide 1.2s ease-in-out infinite;
      }
      @keyframes rupee-coin-flip {
        0% {
          transform: rotateY(0deg) scale(1);
        }
        50% {
          transform: rotateY(180deg) scale(1.05);
        }
        100% {
          transform: rotateY(360deg) scale(1);
        }
      }
      @keyframes rupee-shine-sweep {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(120%);
        }
      }
      @keyframes rupee-glow-pulse {
        0%,
        100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.15);
        }
      }
      @keyframes rupee-progress-slide {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(260%);
        }
      }
      @keyframes rupee-overlay-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .rupee-coin,
        .rupee-shine,
        .rupee-glow,
        .rupee-progress-bar,
        .rupee-loader-overlay {
          animation: none;
        }
      }
    `,
  ],
})
export class RupeeLoaderComponent {
  protected readonly loading = inject(LoadingService);
}
