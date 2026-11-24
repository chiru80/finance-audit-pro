import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from './customer.service';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';

describe('CustomerFormComponent - live loan preview', () => {
  let mockSupabaseService: any;
  let mockAuthService: any;
  let mockCustomerService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      user: signal({ id: 'owner-uuid-1', email: 'owner@example.com' }),
    };

    mockSupabaseService = {
      client: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
        })),
      },
    };

    mockCustomerService = {
      loadVillages: vi.fn(() => Promise.resolve()),
      villages: signal([]),
      createVillage: vi.fn(),
      createCustomer: vi.fn(),
      updateCustomer: vi.fn(),
    };
  });

  afterEach(() => {
    // Flush any async microtasks left by the form's valueChanges subscription.
  });

  const createComponent = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: FormBuilder, useValue: new FormBuilder() },
        // Mock Router and ActivatedRoute to avoid NG0201 injection errors
        { provide: Router, useValue: { navigate: vi.fn(), getCurrentNavigation: () => null } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    });
    return runInInjectionContext(injector, () => new CustomerFormComponent());
  };

  it('updates amountGivenRupees live when loan_amount changes', async () => {
    const component = createComponent();
    // Force Angular change detection to settle the toSignal subscription.
    await Promise.resolve();
    await Promise.resolve();

    // No deduction configured -> amount given equals the loan amount.
    expect(component.amountGivenRupees()).toBe(0);

    component.form.get('loan_amount')?.setValue(1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(component.amountGivenRupees()).toBe(1000);

    component.form.get('loan_amount')?.setValue(5000);
    await Promise.resolve();
    await Promise.resolve();
    expect(component.amountGivenRupees()).toBe(5000);
  });

  it('deducts per Rs 1000 when deductionPer1000 is set', async () => {
    const component = createComponent();
    await Promise.resolve();
    await Promise.resolve();

    // Simulate the settings loader populating the deduction rate (Rs 20 per 1000).
    component.deductionPer1000.set(20);

    component.form.get('loan_amount')?.setValue(1000);
    await Promise.resolve();
    await Promise.resolve();
    // 1000 - 1000 * (20/1000) = 980
    expect(component.amountGivenRupees()).toBe(980);
    expect(component.deductionFormatted()).toBe('20');

    component.form.get('loan_amount')?.setValue(60000);
    await Promise.resolve();
    await Promise.resolve();
    // 60000 - 60000 * (20/1000) = 58800
    expect(component.amountGivenRupees()).toBe(58800);
    expect(component.deductionFormatted()).toBe('1,200');
  });

  it('does not recompute when deductionPer1000 is unchanged and loan_amount is untouched', async () => {
    const component = createComponent();
    await Promise.resolve();
    await Promise.resolve();

    component.form.get('loan_amount')?.setValue(10000);
    await Promise.resolve();
    await Promise.resolve();
    expect(component.amountGivenRupees()).toBe(10000);

    // Changing an unrelated control must not affect the loan preview.
    component.form.get('weekly_due_amount')?.setValue(750);
    await Promise.resolve();
    await Promise.resolve();
    expect(component.amountGivenRupees()).toBe(10000);
  });
});
