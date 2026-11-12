import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, UrlTree, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { canAuthenticate, adminGuard, guestGuard } from './auth.guard';

// Mock Router
const mockNavigate = vi.fn(() => Promise.resolve(true));
const mockRouter: Partial<Router> = {
  navigate: mockNavigate,
  createUrlTree: vi.fn(() => ({} as UrlTree)),
};

const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = {} as RouterStateSnapshot;

describe('Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canAuthenticate', () => {
    it('should allow access when user is authenticated', async () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => canAuthenticate(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is not authenticated', async () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => canAuthenticate(dummyRoute, dummyState));
      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user is authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => adminGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is not authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => adminGuard(dummyRoute, dummyState));
      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      const injector = Injector.create({
        providers: [
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => guestGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const result = runInInjectionContext(injector, () => guestGuard(dummyRoute, dummyState));
      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
