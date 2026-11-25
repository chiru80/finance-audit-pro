import type { OnInit, OnDestroy } from '@angular/core';
import { Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from './auth.service';
import { BrandLogoComponent } from '../shared/brand-logo.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [BrandLogoComponent],
  template: `
    <div
      class="fx-canvas flex min-h-[100dvh] items-center justify-center bg-[var(--bg-primary)] px-5 py-12 text-[var(--text-primary)]"
    >
      <div class="fx-card w-full max-w-md p-8 text-center">
        <div class="mx-auto mb-5 flex justify-center">
          <app-brand-logo [size]="44" />
        </div>
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
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private _authSubscription: { unsubscribe: () => void } | null = null;
  private _fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private _navigated = false;

  constructor() {
    effect(() => {
      if (this._authService.isAuthenticated()) {
        this.navigateToDashboard();
      }
    });
  }

  ngOnInit() {
    this.handleAuthCallback();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private async handleAuthCallback() {
    const callbackParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const providerError = callbackParams.get('error') ?? hashParams.get('error');

    if (providerError) {
      this.redirectToLogin(providerError === 'access_denied' ? 'oauth_cancelled' : 'oauth_failed');
      return;
    }

    if (this._authService.isAuthenticated()) {
      this.navigateToDashboard();
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

      if (session?.user || this._authService.isAuthenticated()) {
        this.navigateToDashboard();
        return;
      }

      const {
        data: { subscription },
      } = this._supabaseService.onAuthStateChange((event, newSession) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
          this.navigateToDashboard();
        }
      });
      this._authSubscription = subscription;

      this._fallbackTimeout = setTimeout(async () => {
        if (this._navigated) return;
        if (this._authService.isAuthenticated()) {
          this.navigateToDashboard();
          return;
        }
        try {
          const retry = await this._supabaseService.getSession();
          if (retry.data.session?.user || this._authService.isAuthenticated()) {
            this.navigateToDashboard();
          } else {
            this.redirectToLogin();
          }
        } catch (err) {
          console.error('OAuth session verification failed:', err);
          this.redirectToLogin();
        }
      }, 2500);
    } catch (error) {
      console.error('Unexpected error in OAuth callback:', error);
      if (this._authService.isAuthenticated()) {
        this.navigateToDashboard();
      } else {
        this.redirectToLogin('callback_error');
      }
    }
  }

  private navigateToDashboard() {
    if (this._navigated) return;
    this._navigated = true;
    this.cleanup();
    this._router.navigate(['/dashboard'], { replaceUrl: true });
  }

  private redirectToLogin(error = 'oauth_failed') {
    if (this._navigated) return;
    this._navigated = true;
    this.cleanup();
    this._router.navigate(['/login'], { queryParams: { error }, replaceUrl: true });
  }

  private cleanup() {
    this._authSubscription?.unsubscribe();
    this._authSubscription = null;
    if (this._fallbackTimeout) {
      clearTimeout(this._fallbackTimeout);
      this._fallbackTimeout = null;
    }
  }
}
