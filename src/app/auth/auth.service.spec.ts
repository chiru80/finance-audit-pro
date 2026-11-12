import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { User, Session } from '@supabase/supabase-js';

describe('AuthService', () => {
  let mockSupabaseService: any;
  let mockAuthClient: any;
  let authStateCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthClient = {
      onAuthStateChange: vi.fn((cb) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      from: vi.fn(),
    };

    mockSupabaseService = {
      client: {
        auth: mockAuthClient,
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
            })),
          })),
          insert: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      },
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signIn: vi.fn((email, password) => Promise.resolve({ data: { user: { id: 'u1', email } }, error: null })),
      signUp: vi.fn((email, password) => Promise.resolve({ data: { user: { id: 'u2', email } }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    };
  });

  const createService = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    });
    return runInInjectionContext(injector, () => new AuthService());
  };

  it('should initialize with loading false and no authenticated user when session is null', async () => {
    const service = createService();
    // Allow promise tick
    await new Promise((r) => setTimeout(r, 0));

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should authenticate successfully with signIn', async () => {
    const service = createService();
    const result = await service.signIn('test@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(mockSupabaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should return error on signIn failure', async () => {
    mockSupabaseService.signIn.mockResolvedValueOnce({ data: null, error: { message: 'Invalid credentials' } });

    const service = createService();
    const result = await service.signIn('bad@example.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    expect(service.error()).toBe('Invalid credentials');
  });

  it('should sign up successfully with signUp', async () => {
    const service = createService();
    const result = await service.signUp('new@example.com', 'secret123');

    expect(result.success).toBe(true);
    expect(mockSupabaseService.signUp).toHaveBeenCalledWith('new@example.com', 'secret123');
  });

  it('should handle signOut successfully', async () => {
    const service = createService();
    const result = await service.signOut();

    expect(result.success).toBe(true);
    expect(mockSupabaseService.signOut).toHaveBeenCalled();
  });

  it('should create profile after signup for valid user', async () => {
    const service = createService();
    const dummyUser = { id: 'u123', email: 'owner@example.com' } as User;

    const result = await service.createProfileAfterSignup(dummyUser, 'John Doe');
    expect(result.success).toBe(true);
    expect(mockSupabaseService.client.from).toHaveBeenCalledWith('profiles');
  });

  it('should fail profile creation gracefully when user is null', async () => {
    const service = createService();
    const result = await service.createProfileAfterSignup(null, 'John Doe');

    expect(result.success).toBe(false);
    expect(result.error).toBe('No user provided');
  });
});
