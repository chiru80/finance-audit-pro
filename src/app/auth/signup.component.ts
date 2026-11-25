import { Component, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="fx-auth-shell min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] md:grid md:grid-cols-[minmax(400px,.95fr)_minmax(0,1.05fr)] xl:grid-cols-[minmax(460px,.9fr)_minmax(0,1.1fr)]"
    >
      <!-- Form panel -->
      <section class="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div class="w-full max-w-[420px]">
          <div class="mb-7 flex items-center gap-3 md:hidden">
            <span
              class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary-accent)] text-[var(--color-on-primary)]"
            >
              <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.9"
                  d="M6 3v18M6 4h12M6 11h9"
                />
              </svg>
            </span>
            <p class="text-sm font-bold tracking-tight">Finance Audit Pro</p>
          </div>

          <div class="fx-card fx-auth-form-card p-6 sm:p-8 lg:p-10">
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

            <div
              role="status"
              class="rounded-[10px] border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-muted)] px-3.5 py-3 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              New account registration is closed. Sign in with the existing owner account.
            </div>

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
        class="fx-auth-story hidden flex-col justify-between border-l border-[var(--glass-border-subtle)] px-7 py-8 md:flex xl:px-16 xl:py-12"
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
                d="M6 3v18M6 4h12M6 11h9"
              />
            </svg>
          </span>
        </div>

        <div class="max-w-lg">
          <span class="fx-eyebrow">Built for clarity</span>
          <h1
            class="fx-auth-headline mt-5 text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.045em]"
          >
            A steadier way to collect.
          </h1>
          <p class="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Add customers, record weekly collections, and keep every outstanding balance visible in
            one secure workspace.
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
        color: #f2f7f1;
        --text-primary: #f2f7f1;
        --text-secondary: #c4d7c9;
        --text-muted: #a0b9a7;
        --color-primary-text: #d5ef9e;
        --primary-accent: #d5ef9e;
        --color-primary-tint: rgba(213, 239, 158, 0.12);
        --glass-border-subtle: rgba(232, 244, 235, 0.15);
        --glass-surface-base: rgba(232, 244, 235, 0.07);
        background-color: #143c30;
        background-image:
          radial-gradient(ellipse 55% 48% at 92% 15%, rgba(213, 239, 158, 0.15), transparent 72%),
          linear-gradient(rgba(236, 246, 238, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(236, 246, 238, 0.035) 1px, transparent 1px),
          linear-gradient(145deg, #194838, #103328 80%);
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
        border: 1px solid rgba(213, 239, 158, 0.18);
        border-radius: 50%;
        box-shadow:
          0 0 0 2rem rgba(213, 239, 158, 0.035),
          0 0 0 4rem rgba(213, 239, 158, 0.025);
        pointer-events: none;
      }

      .fx-auth-story > * {
        position: relative;
        z-index: 1;
      }

      .fx-auth-headline {
        display: block;
        max-width: 12ch;
        color: #f2f7f1;
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
        border: 1px solid rgba(232, 244, 235, 0.18);
        border-radius: 16px;
        background: rgba(232, 244, 235, 0.075);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .fx-ledger-preview__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(232, 244, 235, 0.14);
        color: #d5ef9e;
        font-size: 0.59rem;
        font-weight: 700;
        letter-spacing: 0.14em;
      }

      .fx-ledger-preview__private {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: #afc6b5;
        font-size: 0.56rem;
        letter-spacing: 0.1em;
      }

      .fx-ledger-preview__private i {
        width: 0.4rem;
        height: 0.4rem;
        border-radius: 50%;
        background: #bfe481;
        box-shadow: 0 0 0 3px rgba(191, 228, 129, 0.12);
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
        border: 1px solid rgba(213, 239, 158, 0.34);
        border-radius: 8px;
        color: #d5ef9e;
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
        color: #afc6b5;
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
