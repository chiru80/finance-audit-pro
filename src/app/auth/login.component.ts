import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div>
          <h2 class="text-center text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p class="mt-1 text-center text-sm text-gray-500">Sign in to your Finance Audit Pro account</p>
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

        <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
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
              required
            />
          </div>

          <button
            type="submit"
            class="w-full justify-center rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
          <span>Don't have an account?</span>
          <a routerLink="/signup" class="font-medium text-blue-600 hover:text-blue-500 ml-1">Create account</a>
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
  error = signal<string | null>(null);

  get isPlaceholderEnv(): boolean {
    return !environment.supabaseUrl || environment.supabaseUrl.includes('your-project.supabase.co');
  }

  async onSubmit() {
    this.error.set(null);

    if (!this.email || !this.password) {
      this.error.set('Please enter both email and password.');
      return;
    }

    const { success, error } = await this._authService.signIn(this.email.trim(), this.password);

    if (!success) {
      this.error.set(error || 'Login failed');
      return;
    }

    this._router.navigate(['/dashboard']);
  }
}