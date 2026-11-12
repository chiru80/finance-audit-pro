import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 class="mb-6 text-center text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p class="mb-6 text-center text-sm text-gray-600">Sign in to your Finance Audit Pro account</p>
        </div>

        @if (error()) {
          <div class="mb-4 flex items-center rounded-md bg-red-50 p-3 text-sm text-red-700">
            <span>!</span>
            <span>{{ error() }}</span>
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
              required
            />
          </div>

          <button
            type="submit"
            class="w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">Don't have an account?</p>
          <a routerLink="/signup" class="font-medium text-blue-600 hover:text-blue-500">Create account</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  email = '';
  password = '';
  error = signal<string | null>('');

  async onSubmit() {
    this.error.set('');
    const { success, error } = await this._authService.signIn(this.email, this.password);

    if (!success) {
      this.error.set(error || 'Login failed');
      return;
    }

    this._router.navigate(['/dashboard']);
  }
}