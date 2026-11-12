/**
 * Authentication Guard for Finance Audit Pro
 *
 * Protects routes that require authentication
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, CanMatchFn } from '@angular/router';
import { AuthService } from './auth.service';

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
 * Admin guard for admin-only routes
 * Currently redirects to auth service check
 * Can be extended for role-based access control
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }

  // TODO: Add role checking when roles are implemented
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