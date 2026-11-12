import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, type CanActivateFn, type CanMatchFn, type Route, type UrlSegment, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { canAuthenticate, adminGuard, guestGuard } from './auth.guard';

// Mock Router
const mockNavigate = vi.fn(() => Promise.resolve(true));
const mockRouter: Partial<Router> = {
  navigate: mockNavigate,
  createUrlTree: vi.fn(() => {
    const tree = {} as UrlTree;
    return tree;
  }),
};

describe('Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('canAuthenticate', () => {
    it('should allow access when user is authenticated', async () => {
      // Create mock auth service that returns true for isAuthenticated
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      // Get the guard function
      const guardFn = canAuthenticate as () => boolean | UrlTree | Promise<boolean | UrlTree> | Observable<boolean | UrlTree>;
      const result = guardFn();

      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is not authenticated', async () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const guardFn = canAuthenticate as () => boolean | UrlTree | Promise<boolean | UrlTree> | Observable<boolean | UrlTree>;
      const result = guardFn();

      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user is authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const guardFn = adminGuard as () => boolean | UrlTree;
      const result = guardFn();

      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is not authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const guardFn = adminGuard as () => boolean | UrlTree;
      const result = guardFn();

      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const guardFn = guestGuard as () => boolean | UrlTree;
      const result = guardFn();

      expect(result).toBe(true);
    });

    it('should deny access and redirect when user is authenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => true,
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
        ],
      });

      const guardFn = guestGuard as () => boolean | UrlTree;
      const result = guardFn();

      expect(result).toBe(false);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});

// Import Observable for the type signature
import { Observable } from 'rxjs';