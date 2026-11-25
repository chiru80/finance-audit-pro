import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, GlassButtonComponent, GlassInputDirective],
  template: `
    <div
      class="fx-auth-shell min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] lg:grid lg:grid-cols-[minmax(420px,540px)_minmax(0,1fr)]"
    >
      <!-- Form panel -->
      <section class="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div class="w-full max-w-[420px]">
          <div class="mb-8 flex items-center gap-3 lg:hidden">
            <span
              class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary-accent)] text-[var(--color-on-primary)]"
            >
              <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.9"
                  d="M4 19V9m5 10V5m5 14v-7m5 7V8"
                />
              </svg>
            </span>
            <p class="text-sm font-bold tracking-tight">Finance Audit Pro</p>
          </div>

          <div class="fx-card p-7 sm:p-8">
            <div class="mb-7">
              <span class="fx-eyebrow">Create account</span>
              <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em]">Set up your workspace</h2>
              <p class="mt-1.5 text-sm text-[var(--text-secondary)]">
                One private owner account for your collections and audit records.
              </p>
            </div>

            @if (isPlaceholderEnv) {
              <div
                class="mb-5 rounded-[10px] border border-[var(--color-warning-border)] bg-[var(--color-warning-tint)] px-3.5 py-3 text-xs leading-relaxed text-[var(--color-warning-text)]"
              >
                <span class="font-semibold">Supabase configuration needed.</span>
                Update
                <code class="rounded bg-[var(--glass-surface-muted)] px-1 py-0.5"
                  >src/environments/environment.ts</code
                >
                with your project URL and anon key.
              </div>
            }

            @if (error()) {
              <div
                role="alert"
                aria-live="polite"
                class="mb-5 rounded-[10px] border border-[var(--color-danger-border)] bg-[var(--color-danger-tint)] px-3.5 py-3 text-xs leading-relaxed text-[var(--color-danger-text)]"
              >
                {{ error() }}
              </div>
            }

            @if (isCreatingProfile()) {
              <div
                class="mb-5 flex items-center gap-2 rounded-[10px] border border-[var(--color-primary-border)] bg-[var(--color-primary-tint)] px-3.5 py-3 text-xs text-[var(--color-primary-text)]"
              >
                <span class="fx-spin h-4! w-4!"></span>
                Creating your owner account...
              </div>
            }

            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label for="fullName" class="fx-label mb-2 block">Full name</label>
                <input
                  glassInput
                  type="text"
                  id="fullName"
                  placeholder="Your name"
                  [(ngModel)]="fullName"
                  name="fullName"
                  required
                  autocomplete="name"
                />
              </div>

              <div>
                <label for="email" class="fx-label mb-2 block">Email address</label>
                <input
                  glassInput
                  type="email"
                  id="email"
                  placeholder="owner@example.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                />
              </div>

              <div>
                <label for="password" class="fx-label mb-2 block">Password</label>
                <input
                  glassInput
                  type="password"
                  id="password"
                  placeholder="At least 6 characters"
                  [(ngModel)]="password"
                  name="password"
                  minlength="6"
                  required
                  autocomplete="new-password"
                />
                <p class="mt-1.5 text-[11px] text-[var(--text-muted)]">
                  Use at least 6 characters.
                </p>
              </div>

              <glass-button
                variant="filled"
                type="submit"
                size="lg"
                customClass="mt-6! w-full"
                [disabled]="isCreatingProfile()"
              >
                Create account
              </glass-button>
            </form>

            <p
              class="mt-6 border-t border-[var(--glass-border-subtle)] pt-5 text-center text-xs text-[var(--text-secondary)]"
            >
              Already have an account?
              <a routerLink="/login" class="fx-link ml-1 font-semibold">Sign in</a>
            </p>
          </div>
        </div>
      </section>

      <!-- Editorial panel -->
      <section
        class="fx-auth-story hidden flex-col justify-between border-l border-[var(--glass-border-subtle)] px-10 py-10 lg:flex xl:px-16 xl:py-12"
      >
        <div class="flex items-center justify-end gap-3">
          <div class="text-right">
            <p class="text-[13px] font-bold tracking-tight">Finance Audit Pro</p>
            <p
              class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-text)]"
            >
              Collections & audit
            </p>
          </div>
          <span
            class="fx-brand-mark inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary-accent)] text-[var(--color-on-primary)]"
          >
            <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.9"
                d="M4 19V9m5 10V5m5 14v-7m5 7V8"
              />
            </svg>
          </span>
        </div>

        <div class="max-w-lg">
          <span class="fx-eyebrow">Built for clarity</span>
          <h1
            class="mt-5 text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.045em]"
          >
            Start with a ledger you can trust.
          </h1>
          <p class="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Add customers, record weekly collections, and keep every outstanding balance visible in
            one secure workspace.
          </p>

          <div class="mt-10 grid gap-3 sm:grid-cols-2">
            <div class="fx-auth-point">
              <p class="text-xs font-semibold text-[var(--text-primary)]">Single-owner security</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Your records stay private to your account.
              </p>
            </div>
            <div class="fx-auth-point">
              <p class="text-xs font-semibold text-[var(--text-primary)]">Audit-ready history</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Transactions remain traceable over time.
              </p>
            </div>
          </div>
        </div>

        <p class="text-right text-[11px] text-[var(--text-muted)]">
          Private workspace · Built for single-owner operations
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      .fx-auth-story {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        background-color: var(--bg-sidebar);
        background-image:
          radial-gradient(ellipse 78% 70% at 8% 18%, rgba(209, 170, 105, 0.13), transparent 72%),
          radial-gradient(ellipse 55% 60% at 94% 82%, rgba(126, 132, 98, 0.08), transparent 72%),
          linear-gradient(145deg, #12110e, var(--bg-sidebar) 62%);
      }

      .fx-auth-story::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-left: 1px solid var(--glass-border-subtle);
        background: linear-gradient(90deg, rgba(209, 170, 105, 0.035), transparent 42%);
      }

      .fx-auth-story::after {
        content: '';
        position: absolute;
        z-index: 0;
        top: 50%;
        right: -25%;
        width: min(62vw, 760px);
        aspect-ratio: 1;
        transform: translateY(-50%);
        border: 1px solid rgba(209, 170, 105, 0.09);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(209, 170, 105, 0.055), transparent 68%);
        pointer-events: none;
      }

      .fx-auth-shell > section:last-child > div > .fx-card {
        animation: auth-card-enter 480ms var(--glass-spring-easing) both;
      }

      @keyframes auth-card-enter {
        from { opacity: 0; transform: translate3d(0, 10px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .fx-auth-shell > section:last-child > div > .fx-card {
          animation: none;
        }
      }

      .fx-auth-story > * {
        position: relative;
        z-index: 1;
      }

      .fx-auth-point {
        padding: 0.875rem;
        border-radius: 10px;
        border: 1px solid var(--glass-border-subtle);
        background: var(--glass-surface-base);
      }

      @media (max-width: 1023px) {
        .fx-auth-story {
          display: none !important;
        }
      }
    `,
  ],
})
export class SignupComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  email = '';
  password = '';
  fullName = '';
  error = signal<string | null>(null);

  get isPlaceholderEnv(): boolean {
    return !environment.supabaseUrl || environment.supabaseUrl.includes('your-project.supabase.co');
  }

  async onSubmit() {
    this.error.set(null);

    if (!this.email || !this.password) {
      this.error.set('Please provide email and password.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    const { success, error, data } = await this._authService.signUp(
      this.email.trim(),
      this.password,
    );

    if (!success) {
      this.error.set(error || 'Signup failed');
      return;
    }

    try {
      await this._authService.createProfileAfterSignup(data?.user ?? null, this.fullName.trim());
      this._router.navigate(['/login']);
    } catch (e) {
      console.error('Unexpected error creating profile:', e);
      this._router.navigate(['/login']);
    }
  }

  isCreatingProfile() {
    return this._authService.creatingProfile();
  }
}
