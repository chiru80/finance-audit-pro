import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200 text-center">
        <div class="animate-spin mb-4">
          <svg class="h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
        <p class="text-sm text-gray-600">Please wait while we verify your session.</p>
      </div>
    </div>
  `,
})
export class OauthCallbackComponent implements OnInit, OnDestroy {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _router = inject(Router);

  ngOnInit() {
    // Handle the OAuth callback - Supabase will process the URL hash/token
    this.handleAuthCallback();
  }

  ngOnDestroy() {
    // Clean up any pending operations
  }

  private async handleAuthCallback() {
    try {
      // Supabase handles the OAuth callback automatically
      // The getSession() will return the new session after the redirect
      const { data: { session }, error } = await this._supabaseService.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        // Navigate to login with error
        this._router.navigate(['/login'], {
          queryParams: { error: 'oauth_failed' }
        });
        return;
      }

      if (session?.user) {
        // Successfully authenticated via Google
        // The AuthService will auto-create the profile via the auth state listener
        setTimeout(() => {
          this._router.navigate(['/dashboard']);
        }, 1000); // Brief delay to ensure profile is created
      } else {
        // No session - redirect to login
        this._router.navigate(['/login']);
      }
    } catch (err) {
      console.error('Unexpected error in OAuth callback:', err);
      this._router.navigate(['/login'], {
        queryParams: { error: 'callback_error' }
      });
    }
  }
}