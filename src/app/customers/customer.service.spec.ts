import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { CustomerService } from './customer.service';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer } from './customer.types';

describe('CustomerService', () => {
  let mockSupabaseService: any;
  let mockAuthService: any;
  const mockUser = { id: 'owner-uuid-1', email: 'owner@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      user: signal(mockUser),
    };

    mockSupabaseService = {
      client: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [
                { id: 'c1', name: 'Ravi Kumar', weekly_due_amount: 50000, status: 'active' },
                { id: 'c2', name: 'Sita Devi', weekly_due_amount: 30000, status: 'active' },
              ],
              error: null,
            })),
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { id: 'c3', name: 'New Customer', weekly_due_amount: 50000 },
                error: null,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      },
    };
  });

  const createService = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    return runInInjectionContext(injector, () => new CustomerService());
  };

  it('should load customers on initialization', async () => {
    const service = createService();
    await new Promise((r) => setTimeout(r, 0));

    expect(service.customers().length).toBe(2);
    expect(service.customers()[0].name).toBe('Ravi Kumar');
    expect(service.loading()).toBe(false);
  });

  it('should create customer using authenticated user profile_id', async () => {
    const service = createService();
    await new Promise((r) => setTimeout(r, 0));

    const newCustomer = await service.createCustomer({
      name: 'New Customer',
      phone: '9876543210',
      email: 'new@example.com',
      weekly_due_amount: 50000,
    });

    expect(newCustomer.id).toBe('c3');
    expect(mockSupabaseService.client.from).toHaveBeenCalledWith('customers');
  });

  it('should throw error when creating customer if user is unauthenticated', async () => {
    mockAuthService.user.set(null);
    const service = createService();

    await expect(
      service.createCustomer({
        name: 'Fail',
        phone: '',
        email: '',
        weekly_due_amount: 50000,
      })
    ).rejects.toThrow('User not authenticated');
  });

  it('should update customer successfully', async () => {
    const service = createService();
    await service.updateCustomer('c1', {
      name: 'Ravi Kumar Updated',
      phone: '9876543210',
      email: 'ravi@example.com',
      weekly_due_amount: 60000,
    });

    expect(mockSupabaseService.client.from).toHaveBeenCalledWith('customers');
  });

  it('should delete customer successfully', async () => {
    const service = createService();
    await service.deleteCustomer('c1');

    expect(mockSupabaseService.client.from).toHaveBeenCalledWith('customers');
  });
});
