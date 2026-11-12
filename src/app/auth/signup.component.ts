import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-signup',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div>
          <h2 class="text-center text-2xl font-bold text-gray-900">Create Account</h2>
          <p class="mt-1 text-center text-sm text-gray-500">Sign up to start managing your finances</p>
        </div>

        @if (isPlaceholderEnv) {
          <div class="mt-4 rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <span class="font-semibold block mb-0.5">⚠️ Supabase Configuration Note</span>
            Your app is currently using placeholder credentials. To connect live auth and database, update <code class="bg-amber-100 px-1 rounded">src/environments/environment.ts</code> with your Supabase URL and Anon Key.
          </div>
        }

        @if (error()) {
          <div class="mt-4 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <span class="mr-2 font-bold">!</span>
            <span>{{ error() }}</span>
          </div>
        }

        @if (isCreatingProfile()) {
          <div class="mt-4 flex items-center rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating your owner account...
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
          <div>
            <label for="fullName" class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              id="fullName"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="John Doe"
              [(ngModel)]="fullName"
              name="fullName"
              required
            />
          </div>

          <div>
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              id="email"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="owner@example.com"
              [(ngModel)]="email"
              name="email"
              required
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              minlength="6"
              required
            />
            <p class="text-[11px] text-gray-400 mt-1">Must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            class="w-full justify-center rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            [disabled]="isCreatingProfile()"
          >
            Create Account
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
          <span>Already have an account?</span>
          <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500 ml-1">Sign in</a>
        </div>
      </div>
    </div>
  `,
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

    const { success, error, data } = await this._authService.signUp(this.email.trim(), this.password);

    if (!success) {
      this.error.set(error || 'Signup failed');
      return;
    }

    // Create profile for the new user after successful signup
    try {
      await this._authService.createProfileAfterSignup(
        data?.user ?? null,
        this.fullName.trim()
      );

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