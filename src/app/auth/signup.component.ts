import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-signup',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 class="mb-6 text-center text-2xl font-bold text-gray-900">Create Account</h2>
          <p class="mb-6 text-center text-sm text-gray-600">Sign up to start managing your finances</p>
        </div>

        @if (error()) {
          <div class="mb-4 flex items-center rounded-md bg-red-50 p-3 text-sm text-red-700">
            <span>!</span>
            <span>{{ error() }}</span>
          </div>
        }

        @if (isCreatingProfile()) {
          <div class="mb-4 flex items-center rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating your account...
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              id="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="you@example.com"
              [(ngModel)]="email"
              name="email"
              required
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              minlength="6"
              required
            />
          </div>

          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              id="fullName"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="John Doe"
              [(ngModel)]="fullName"
              name="fullName"
            />
          </div>

          <button
            type="submit"
            class="w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            [disabled]="isCreatingProfile()"
          >
            Create Account
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">Already have an account?</p>
          <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">Sign in</a>
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
  error = signal<string | null>('');

  async onSubmit() {
    this.error.set('');
    const { success, error, data } = await this._authService.signUp(this.email, this.password);

    if (!success) {
      this.error.set(error || 'Signup failed');
      return;
    }

    // Create profile for the new user after successful signup
    try {
      const { success: profileSuccess, error: profileError } = await this._authService.createProfileAfterSignup(
        data?.user ?? null,
        this.fullName
      );

      if (!profileSuccess) {
        // Profile creation failed, but user was created
        console.error('Profile creation failed:', profileError);
        // Continue anyway - user can log in manually
      }

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