import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import type { UrlTree } from '@angular/router';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { canAuthenticate, adminGuard, guestGuard } from './auth.guard';

// Mock Router
const mockNavigate = vi.fn(() => Promise.resolve(true));
const mockUrlTree = {} as UrlTree;
const mockCreateUrlTree = vi.fn(() => mockUrlTree);
const mockRouter: Partial<Router> = {
  navigate: mockNavigate,
  createUrlTree: mockCreateUrlTree,
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
    it('should allow access when the authenticated user is the owner', async () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };
      const mockSupabaseService = {
        client: { rpc: vi.fn(() => Promise.resolve({ data: true, error: null })) },
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
          { provide: SupabaseService, useValue: mockSupabaseService },
        ],
      });

      const result = await runInInjectionContext(injector, () =>
        adminGuard(dummyRoute, dummyState),
      );
      expect(result).toBe(true);
      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith('is_app_owner');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockCreateUrlTree).not.toHaveBeenCalled();
    });

    it('should deny access and redirect when the authenticated user is not the owner', async () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };
      const mockSupabaseService = {
        client: { rpc: vi.fn(() => Promise.resolve({ data: false, error: null })) },
      };

      const injector = Injector.create({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
          { provide: SupabaseService, useValue: mockSupabaseService },
        ],
      });

      const result = await runInInjectionContext(injector, () =>
        adminGuard(dummyRoute, dummyState),
      );
      expect(result).toBe(mockUrlTree);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(mockNavigate).not.toHaveBeenCalled();
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

      const result = await runInInjectionContext(injector, () =>
        adminGuard(dummyRoute, dummyState),
      );
      expect(result).toBe(mockUrlTree);
      expect(mockCreateUrlTree).toHaveBeenCalledWith(['/login']);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      const injector = Injector.create({
        providers: [{ provide: AuthService, useValue: mockAuthService }],
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
