import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, GlassCardComponent, GlassButtonComponent, GlassInputDirective],
  template: `
    <div class="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <!-- Ambient Fluid Light Drops in Background -->
      <div class="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl"></div>
      <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl"></div>

      <glass-card variant="elevated" customClass="w-full max-w-md p-8 sm:p-10 relative z-10">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center text-white shadow-lg shadow-blue-500/30 border border-white/40 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your Finance Audit Pro account</p>
        </div>

        @if (googleSignInError()) {
          <div class="mb-4 flex items-center rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400 border border-red-500/20 backdrop-blur-sm">
            <span class="mr-2 font-bold flex-shrink-0">!</span>
            <span>{{ googleSignInError() }}</span>
          </div>
        }

        @if (!isPlaceholderEnv) {
          <button
            type="button"
            (click)="onGoogleSignIn()"
            class="w-full flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer"
          >
            <svg class="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
            </svg>
            Continue with Google
          </button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200/60 dark:border-slate-800"></div>
            </div>
            <div class="relative flex justify-center text-xs uppercase tracking-wider">
              <span class="bg-white/80 dark:bg-slate-900/80 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>
        }

        @if (isPlaceholderEnv) {
          <div class="mb-4 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed backdrop-blur-sm">
            <span class="font-semibold block mb-0.5">⚠️ Supabase Configuration Note</span>
            Your app is currently using placeholder credentials. Update <code class="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">src/environments/environment.ts</code> with your Supabase URL and Anon Key.
          </div>
        }

        @if (error()) {
          <div class="mb-4 flex items-center rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400 border border-red-500/20 backdrop-blur-sm">
            <span class="mr-2 font-bold flex-shrink-0">!</span>
            <span>{{ error() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Email address</label>
            <input
              glassInput
              type="email"
              id="email"
              placeholder="owner@example.com"
              [(ngModel)]="email"
              name="email"
              required
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
            <input
              glassInput
              type="password"
              id="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
            />
          </div>

          <glass-button
            variant="filled"
            type="submit"
            size="lg"
            customClass="w-full mt-2"
          >
            Sign In
          </glass-button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800 pt-4">
          <span>Don't have an account?</span>
          <a routerLink="/signup" class="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 ml-1">Create account</a>
        </div>
      </glass-card>
    </div>
  `,
})
export class LoginComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  email = '';
  password = '';
  error = signal<string | null>(null);
  googleSignInError = signal<string | null>(null);

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

  async onGoogleSignIn() {
    this.googleSignInError.set(null);
    try {
      await this._authService.signInWithGoogle();
      // OAuth flow will redirect automatically
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      if (message.includes('cancelled') || message.includes('Cancelled')) {
        this.googleSignInError.set('Google sign-in was cancelled. Please try again.');
      } else {
        this.googleSignInError.set('Unable to sign in with Google. Please try again.');
      }
    }
  }
}
