/**
 * Authentication Guard for Finance Audit Pro
 *
 * Protects routes that require authentication
 */

import { inject } from '@angular/core';
import type { CanActivateFn, CanMatchFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export const canAuthenticate: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

/**
 * Guard to check authentication at route matching level
 * Used for lazy-loaded modules
 */
export const authGuard: CanMatchFn = () => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    return false;
  }

  return true;
};

/**
 * Admin guard for owner-only routes.
 * Authentication alone is not enough in a single-owner app: the server-side
 * is_app_owner() check is authoritative because the anon key is public.
 */
export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const supabaseService = inject(SupabaseService);
  const { data, error } = await supabaseService.client.rpc('is_app_owner');
  if (error || data !== true) {
    // Returning a UrlTree lets the router perform the redirect as part of this
    // navigation. Calling router.navigate() here can be cancelled because the
    // original navigation is still in progress, which makes the click look dead.
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

/**
 * Guest guard for routes that should only be accessible when not logged in
 * (e.g., login page)
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  // If user is not authenticated, allow access
  if (!authService.isAuthenticated()) {
    return true;
  }

  // If user is already authenticated, redirect to dashboard
  const router = inject(Router);
  router.navigate(['/dashboard']);
  return false;
};
