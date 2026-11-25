import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { I18nPipe } from '../shared/i18n.pipe';
import { I18nService } from '../shared/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, GlassButtonComponent, GlassInputDirective, I18nPipe],
  template: `
    <div
      class="fx-auth-shell min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)]"
    >
      <!-- Editorial panel -->
      <section
        class="fx-auth-story hidden flex-col justify-between border-r border-[var(--glass-border-subtle)] px-10 py-10 lg:flex xl:px-16 xl:py-12"
      >
        <div class="flex items-center gap-3">
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
          <div>
            <p class="text-[13px] font-bold tracking-tight">Finance Audit Pro</p>
            <p
              class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-text)]"
            >
              Collections & audit
            </p>
          </div>
        </div>

        <div class="max-w-lg">
          <span class="fx-eyebrow">Finance operations</span>
          <p
            class="mt-5 text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.045em]"
          >
            A clearer way to manage collections.
          </p>
          <p class="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Track customer dues, record collections, and reconcile every entry with a ledger built
            for audit readiness.
          </p>

          <div class="mt-10 grid gap-3 sm:grid-cols-2">
            <div class="fx-auth-point">
              <p class="text-xs font-semibold text-[var(--text-primary)]">Ledger-first records</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Every collection and payment stays traceable.
              </p>
            </div>
            <div class="fx-auth-point">
              <p class="text-xs font-semibold text-[var(--text-primary)]">
                Real outstanding balances
              </p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Know exactly what is due and what is pending.
              </p>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-[var(--text-muted)]">
          Private workspace · Built for single-owner operations
        </p>
      </section>

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

          <div class="fx-card p-8 sm:p-10 shadow-[var(--glass-shadow-md)]">
            <div class="mb-7">
              <span class="fx-eyebrow">Sign in</span>
              <h1 class="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                {{ 'login.title' | i18n }}
              </h1>
              <p class="mt-1.5 text-sm text-[var(--text-secondary)]">
                {{ 'login.subtitle' | i18n }}
              </p>
            </div>

            @if (googleSignInError()) {
              <div
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                class="mb-4 rounded-[10px] border border-[var(--color-danger-border)] bg-[var(--color-danger-tint)] px-3.5 py-3 text-xs leading-relaxed text-[var(--color-danger-text)]"
              >
                {{ googleSignInError() }}
              </div>
            }

            @if (!isPlaceholderEnv) {
              <button
                type="button"
                (click)="onGoogleSignIn()"
                [disabled]="isGoogleSubmitting()"
                [attr.aria-busy]="isGoogleSubmitting()"
                [class.opacity-60]="isGoogleSubmitting()"
                [class.cursor-not-allowed]="isGoogleSubmitting()"
                class="fx-btn fx-btn--secondary h-11 w-full min-h-[44px]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                {{
                  (isGoogleSubmitting() ? 'login.connecting' : 'login.sign_in_with_google') | i18n
                }}
              </button>

              <div class="my-6 flex items-center gap-3">
                <span class="h-px flex-1 bg-[var(--glass-border-subtle)]"></span>
                <span
                  class="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]"
                  >{{ 'login.or_use_email' | i18n }}</span
                >
                <span class="h-px flex-1 bg-[var(--glass-border-subtle)]"></span>
              </div>
            }

            @if (isPlaceholderEnv) {
              <div
                class="mb-5 rounded-[10px] border border-[var(--color-warning-border)] bg-[var(--color-warning-tint)] px-3.5 py-3 text-xs leading-relaxed text-[var(--color-warning-text)]"
              >
                <span class="font-semibold">{{ 'login.supabase_config_needed' | i18n }}</span>
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

            <form (ngSubmit)="onSubmit()" [attr.aria-busy]="isSubmitting()" class="space-y-4">
              <div>
                <label for="email" class="fx-label mb-2 block">{{ 'login.email' | i18n }}</label>
                <input
                  glassInput
                  type="email"
                  id="email"
                  placeholder="owner@example.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                  inputmode="email"
                  [disabled]="isSubmitting()"
                />
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label for="password" class="fx-label">{{ 'login.password' | i18n }}</label>
                </div>
                <input
                  glassInput
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                  enterkeyhint="go"
                  [disabled]="isSubmitting()"
                />
              </div>

              <glass-button
                variant="filled"
                type="submit"
                size="lg"
                customClass="mt-6! w-full"
                [disabled]="isSubmitting()"
                [loading]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  {{ 'login.signing_in' | i18n }}
                } @else {
                  {{ 'login.sign_in' | i18n }}
                }
              </glass-button>
            </form>

            <p
              class="mt-6 border-t border-[var(--glass-border-subtle)] pt-5 text-center text-xs text-[var(--text-secondary)]"
            >
              @if (isEnglish()) {
                <span>New here?</span>
                <a routerLink="/signup" class="fx-link ml-1 font-semibold">{{
                  'login.dont_have_account' | i18n
                }}</a>
              } @else {
                <span>ఇక్కడే?</span>
                <a routerLink="/signup" class="fx-link ml-1 font-semibold">{{
                  'login.create_account' | i18n
                }}</a>
              }
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .fx-auth-story {
        position: relative;
        background-color: var(--bg-sidebar);
        background-image:
          linear-gradient(to bottom, var(--glass-border-subtle) 1px, transparent 1px),
          linear-gradient(to right, var(--glass-border-subtle) 1px, transparent 1px);
        background-size: 64px 64px;
        background-position: -1px -1px;
      }

      .fx-auth-story::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-left: 1px solid var(--glass-border-subtle);
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
export class LoginComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _router = inject(Router);
  private readonly _i18nService = inject(I18nService);

  email = '';
  password = '';
  error = signal<string | null>(null);
  googleSignInError = signal<string | null>(null);
  isSubmitting = signal(false);
  isGoogleSubmitting = signal(false);

  ngOnInit() {
    // If user is already authenticated, take them directly to dashboard
    if (this._authService.isAuthenticated()) {
      this._router.navigate(['/dashboard']);
      return;
    }

    // If redirected to login page with token in URL hash, wait for session and navigate
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      this.isGoogleSubmitting.set(true);
      const {
        data: { subscription },
      } = this._supabaseService.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          subscription.unsubscribe();
          this._router.navigate(['/dashboard']);
        }
      });
      setTimeout(async () => {
        const { data } = await this._supabaseService.getSession();
        if (data.session?.user) {
          subscription.unsubscribe();
          this._router.navigate(['/dashboard']);
        }
        this.isGoogleSubmitting.set(false);
      }, 1200);
    }
  }

  get isPlaceholderEnv(): boolean {
    return !environment.supabaseUrl || environment.supabaseUrl.includes('your-project.supabase.co');
  }

  isEnglish(): boolean {
    return this._i18nService.isEnglish();
  }

  async onSubmit() {
    if (this.isSubmitting()) return;

    this.error.set(null);

    if (!this.email || !this.password) {
      this.error.set('Enter both your email and password to sign in.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { success, error } = await this._authService.signIn(this.email.trim(), this.password);

      if (!success) {
        this.error.set(this.friendlyAuthError(error || 'Unable to sign in.'));
        return;
      }

      this._router.navigate(['/dashboard']);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onGoogleSignIn() {
    if (this.isGoogleSubmitting()) return;

    this.googleSignInError.set(null);
    this.isGoogleSubmitting.set(true);
    try {
      await this._authService.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      if (message.toLowerCase().includes('cancelled')) {
        this.googleSignInError.set('Google sign-in was cancelled. Please try again.');
      } else {
        this.googleSignInError.set('Unable to sign in with Google. Please try again.');
      }
    } finally {
      this.isGoogleSubmitting.set(false);
    }
  }

  /** Translate Supabase's raw auth messages into plain, actionable language. */
  private friendlyAuthError(message: string): string {
    const normalised = message.toLowerCase();
    if (normalised.includes('invalid login credentials')) {
      return "That email and password don't match. Check them and try again.";
    }
    if (normalised.includes('email not confirmed')) {
      return 'Confirm your email address before signing in. Check your inbox for the confirmation link.';
    }
    if (normalised.includes('too many requests') || normalised.includes('rate limit')) {
      return 'Too many sign-in attempts. Wait a moment and try again.';
    }
    return message;
  }
}
