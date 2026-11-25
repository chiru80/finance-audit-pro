import type { OnInit, OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div
      class="fx-canvas flex min-h-[100dvh] items-center justify-center bg-[var(--bg-primary)] px-5 py-12 text-[var(--text-primary)]"
    >
      <div class="fx-card w-full max-w-md p-8 text-center">
        <span
          class="fx-brand-mark mx-auto mb-5 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--primary-accent)] text-[var(--color-on-primary)]"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.9"
              d="M12 4a8 8 0 100 16 8 8 0 000-16z"
            />
          </svg>
        </span>
        <div
          class="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[var(--glass-border-crisp)] border-t-[var(--primary-accent)]"
        ></div>
        <h2 class="text-xl font-semibold tracking-[-0.03em]">Completing sign in</h2>
        <p class="mt-2 text-sm text-[var(--text-secondary)]">
          Please wait while we verify your session.
        </p>
      </div>
    </div>
  `,
})
export class OauthCallbackComponent implements OnInit, OnDestroy {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _router = inject(Router);
  private _authSubscription: { unsubscribe: () => void } | null = null;
  private _fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.handleAuthCallback();
  }

  ngOnDestroy() {
    this.clearAuthSubscription();
    if (this._fallbackTimeout) {
      clearTimeout(this._fallbackTimeout);
      this._fallbackTimeout = null;
    }
  }

  private async handleAuthCallback() {
    const callbackParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const providerError = callbackParams.get('error') ?? hashParams.get('error');

    if (providerError) {
      this.redirectToLogin(providerError === 'access_denied' ? 'oauth_cancelled' : 'oauth_failed');
      return;
    }

    try {
      const {
        data: { session },
        error,
      } = await this._supabaseService.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        this.redirectToLogin();
        return;
      }

      if (session?.user) {
        this._router.navigate(['/dashboard']);
        return;
      }

      // 2. Listen for auth state change (in case Supabase JS is still parsing the URL hash)
      const {
        data: { subscription },
      } = this._supabaseService.onAuthStateChange((event, newSession) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
          this.clearAuthSubscription();
          this._router.navigate(['/dashboard']);
        }
      });
      this._authSubscription = subscription;

      this._fallbackTimeout = setTimeout(async () => {
        try {
          const retry = await this._supabaseService.getSession();
          if (retry.data.session?.user) {
            this._router.navigate(['/dashboard']);
          } else {
            this.redirectToLogin();
          }
        } catch (error) {
          console.error('OAuth session verification failed:', error);
          this.redirectToLogin();
        }
      }, 2500);
    } catch (error) {
      console.error('Unexpected error in OAuth callback:', error);
      this.redirectToLogin('callback_error');
    }
  }

  private clearAuthSubscription() {
    this._authSubscription?.unsubscribe();
    this._authSubscription = null;
  }

  private redirectToLogin(error = 'oauth_failed') {
    this.clearAuthSubscription();
    this._router.navigate(['/login'], { queryParams: { error } });
  }
}
