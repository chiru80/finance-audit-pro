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
              d="M4 19V9m5 10V5m5 14v-7m5 7V8"
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

  ngOnInit() {
    this.handleAuthCallback();
  }

  ngOnDestroy() {
    if (this._authSubscription) {
      this._authSubscription.unsubscribe();
      this._authSubscription = null;
    }
  }

  private async handleAuthCallback() {
    try {
      // 1. Check existing session immediately
      const {
        data: { session },
        error,
      } = await this._supabaseService.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        this._router.navigate(['/login'], {
          queryParams: { error: 'oauth_failed' },
        });
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
          subscription.unsubscribe();
          this._router.navigate(['/dashboard']);
        }
      });
      this._authSubscription = subscription;

      // 3. Fallback verification with timeout
      setTimeout(async () => {
        const retry = await this._supabaseService.getSession();
        if (retry.data.session?.user) {
          if (this._authSubscription) {
            this._authSubscription.unsubscribe();
            this._authSubscription = null;
          }
          this._router.navigate(['/dashboard']);
        } else {
          // If still no session after wait, redirect to login
          setTimeout(() => {
            if (this._authSubscription) {
              this._authSubscription.unsubscribe();
              this._authSubscription = null;
            }
            this._router.navigate(['/login']);
          }, 2000);
        }
      }, 500);
    } catch (err) {
      console.error('Unexpected error in OAuth callback:', err);
      this._router.navigate(['/login'], {
        queryParams: { error: 'callback_error' },
      });
    }
  }
}
