import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, GlassCardComponent, GlassButtonComponent, GlassInputDirective],
  template: `
    <div class="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#070D1A] text-[#F8FAFC]">
      <!-- Ambient Fluid Light Drops in Background -->
      <div class="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl"></div>
      <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl"></div>

      <glass-card variant="elevated" customClass="w-full max-w-md p-8 sm:p-10 relative z-10 bg-[#151F32] border border-[#263449] shadow-2xl rounded-2xl">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[#F8FAFC]">Create Account</h2>
          <p class="mt-1 text-sm text-[#94A3B8]">Sign up to start managing your finances</p>
        </div>

        @if (isPlaceholderEnv) {
          <div class="mb-4 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/20 text-xs text-amber-300 leading-relaxed backdrop-blur-sm">
            <span class="font-semibold block mb-0.5">⚠️ Supabase Configuration Note</span>
            Your app is currently using placeholder credentials. Update <code class="bg-[#0F172A] text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">src/environments/environment.ts</code> with your Supabase URL and Anon Key.
          </div>
        }

        @if (error()) {
          <div class="mb-4 flex items-center rounded-xl bg-red-500/15 p-3 text-sm text-red-400 border border-red-500/30 backdrop-blur-sm">
            <span class="mr-2 font-bold flex-shrink-0">!</span>
            <span>{{ error() }}</span>
          </div>
        }

        @if (isCreatingProfile()) {
          <div class="mb-4 flex items-center rounded-xl bg-blue-500/15 p-3 text-sm text-[#38BDF8] border border-blue-500/30 backdrop-blur-sm">
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating your owner account...
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="fullName" class="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Full Name</label>
            <input
              glassInput
              type="text"
              id="fullName"
              placeholder="Your Name"
              [(ngModel)]="fullName"
              name="fullName"
              required
            />
          </div>

          <div>
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Email address</label>
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
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Password</label>
            <input
              glassInput
              type="password"
              id="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              minlength="6"
              required
            />
            <p class="text-[11px] text-[#64748B] mt-1">Must be at least 6 characters</p>
          </div>

          <glass-button
            variant="filled"
            type="submit"
            size="lg"
            customClass="w-full mt-2"
            [disabled]="isCreatingProfile()"
          >
            Create Account
          </glass-button>
        </form>

        <div class="mt-6 text-center text-sm text-[#94A3B8] border-t border-[#263449] pt-4">
          <span>Already have an account?</span>
          <a routerLink="/login" class="font-semibold text-[#38BDF8] hover:text-[#60A5FA] ml-1">Sign in</a>
        </div>
      </glass-card>
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
