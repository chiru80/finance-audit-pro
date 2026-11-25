import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
      class="fx-auth-shell min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,.95fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(460px,.9fr)]"
    >
      <!-- Editorial panel -->
      <section
        class="fx-auth-story hidden flex-col justify-between border-r border-[var(--glass-border-subtle)] px-7 py-8 lg:flex xl:px-16 xl:py-12"
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
                d="M12 4a8 8 0 100 16 8 8 0 000-16z"
              />
            </svg>
          </span>
          <div>
            <p class="text-[13px] font-bold tracking-tight">Obsidian Luxe</p>
            <p
              class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-text)]"
            >
              FINANCE · AUDIT
            </p>
          </div>
        </div>

        <div class="max-w-lg">
          <span class="fx-eyebrow">Finance operations</span>
          <p
            class="fx-auth-headline mt-5 text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.045em]"
          >
            Clarity in every rupee.
          </p>
          <p class="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Track customer dues, record collections, and reconcile every entry with a ledger built
            for audit readiness.
          </p>

          <div class="fx-ledger-preview" aria-label="How the workspace works">
            <div class="fx-ledger-preview__heading">
              <span>YOUR COLLECTION FLOW</span>
              <span class="fx-ledger-preview__private">
                <i aria-hidden="true"></i>
                PRIVATE WORKSPACE
              </span>
            </div>
            <div class="fx-ledger-preview__step">
              <span class="fx-ledger-preview__number">01</span>
              <span>
                <strong>Keep customer records</strong>
                <small>One clear view of every account.</small>
              </span>
            </div>
            <div class="fx-ledger-preview__step">
              <span class="fx-ledger-preview__number">02</span>
              <span>
                <strong>Record each collection</strong>
                <small>Every payment stays traceable.</small>
              </span>
            </div>
            <div class="fx-ledger-preview__step">
              <span class="fx-ledger-preview__number">03</span>
              <span>
                <strong>Reconcile with confidence</strong>
                <small>Review balances and audit history.</small>
              </span>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-[var(--text-muted)]">
          Private workspace · Built for single-owner operations
        </p>
      </section>

      <!-- Form panel -->
      <section class="flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div class="w-full max-w-[420px]">
          <div class="mb-7 flex items-center gap-3 lg:hidden">
            <span
              class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary-accent)] text-[var(--color-on-primary)]"
            >
              <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.9"
                  d="M12 4a8 8 0 100 16 8 8 0 000-16z"
                />
              </svg>
            </span>
            <p class="text-sm font-bold tracking-tight">Obsidian Luxe</p>
          </div>

          <div class="fx-card fx-auth-form-card p-6 sm:p-8 lg:p-10">
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
        isolation: isolate;
        overflow: hidden;
        color: var(--brand-ivory);
        --text-primary: var(--brand-ivory);
        --text-secondary: #e6dfd0;
        --text-muted: #c4bdae;
        --color-primary-text: var(--brand-champagne);
        --primary-accent: var(--brand-champagne);
        --color-primary-tint: rgba(201, 174, 122, 0.12);
        --glass-border-subtle: rgba(245, 241, 232, 0.15);
        --glass-surface-base: rgba(245, 241, 232, 0.07);
        background-color: var(--brand-obsidian);
        background-image:
          radial-gradient(ellipse 55% 48% at 92% 15%, rgba(201, 174, 122, 0.15), transparent 72%),
          linear-gradient(rgba(245, 241, 232, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245, 241, 232, 0.035) 1px, transparent 1px),
          linear-gradient(145deg, #191a20, #101116 80%);
        background-size:
          auto,
          56px 56px,
          56px 56px,
          auto;
        background-position:
          center,
          -1px -1px,
          -1px -1px,
          center;
      }

      .fx-auth-story::before {
        content: '';
        position: absolute;
        inset: auto -8rem -11rem auto;
        width: 23rem;
        aspect-ratio: 1;
        border: 1px solid rgba(201, 174, 122, 0.18);
        border-radius: 50%;
        box-shadow:
          0 0 0 2rem rgba(201, 174, 122, 0.035),
          0 0 0 4rem rgba(201, 174, 122, 0.025);
        pointer-events: none;
      }

      .fx-auth-story > * {
        position: relative;
        z-index: 1;
      }

      .fx-auth-headline {
        display: block;
        max-width: 12ch;
        color: var(--brand-ivory);
        font-family: var(--font-display);
        font-size: clamp(2.6rem, 5vw, 4.5rem);
        font-weight: 400;
        line-height: 0.98;
        letter-spacing: -0.045em;
      }

      .fx-ledger-preview {
        max-width: 34rem;
        margin-top: 2.4rem;
        padding: 1rem 1.15rem;
        border: 1px solid rgba(245, 241, 232, 0.18);
        border-radius: 16px;
        background: rgba(245, 241, 232, 0.075);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .fx-ledger-preview__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(245, 241, 232, 0.14);
        color: var(--brand-champagne);
        font-size: 0.59rem;
        font-weight: 700;
        letter-spacing: 0.14em;
      }

      .fx-ledger-preview__private {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: #c4bdae;
        font-size: 0.56rem;
        letter-spacing: 0.1em;
      }

      .fx-ledger-preview__private i {
        width: 0.4rem;
        height: 0.4rem;
        border-radius: 50%;
        background: var(--color-success);
        box-shadow: 0 0 0 3px rgba(85, 196, 154, 0.12);
      }

      .fx-ledger-preview__step {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding-top: 0.8rem;
      }

      .fx-ledger-preview__number {
        display: grid;
        width: 1.8rem;
        height: 1.8rem;
        flex: 0 0 auto;
        place-items: center;
        border: 1px solid rgba(201, 174, 122, 0.34);
        border-radius: 8px;
        color: var(--brand-champagne);
        font-size: 0.64rem;
        font-weight: 700;
      }

      .fx-ledger-preview__step strong,
      .fx-ledger-preview__step small {
        display: block;
      }

      .fx-ledger-preview__step strong {
        color: #edf4ed;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .fx-ledger-preview__step small {
        margin-top: 0.12rem;
        color: #c4bdae;
        font-size: 0.67rem;
        line-height: 1.45;
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
  private readonly _route = inject(ActivatedRoute);
  private readonly _i18nService = inject(I18nService);

  email = '';
  password = '';
  error = signal<string | null>(null);
  googleSignInError = signal<string | null>(null);
  isSubmitting = signal(false);
  isGoogleSubmitting = signal(false);

  ngOnInit() {
    const callbackError = this._route.snapshot.queryParamMap.get('error');
    if (callbackError === 'oauth_cancelled') {
      this.googleSignInError.set('Google sign-in was canceled. Please try again.');
    } else if (callbackError) {
      this.googleSignInError.set(
        'Google could not complete sign-in. Check that Google sign-in is enabled and this site’s callback URL is allowed in Supabase, then try again.',
      );
    }

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
