import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import type { Customer, CustomerFormValues, Village } from './customer.types';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  readonly currentUser = computed(() => this._authService.user());

  customers = signal<Customer[]>([]);
  villages = signal<Village[]>([]);
  loading = signal(true);
  loadingVillages = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select(
          `
          *,
          profiles!inner(email, full_name),
          villages(name)
        `,
        )
        .order('name', { ascending: true });

      if (error) throw error;
      this.customers.set(data as Customer[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  async loadVillages() {
    this.loadingVillages.set(true);
    try {
      const user = this.currentUser();
      if (!user) return;

      const { data, error } = await this._supabaseService.client
        .from('villages')
        .select('*')
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      this.villages.set(data as Village[]);
    } catch (err) {
      console.error('Failed to load villages:', err);
      this.villages.set([]);
    } finally {
      this.loadingVillages.set(false);
    }
  }

  async createVillage(name: string): Promise<Village | null> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this._supabaseService.client
      .from('villages')
      .insert({
        profile_id: user.id,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A village with this name already exists');
      }
      throw error;
    }

    this.villages.update((villages) =>
      [...villages, data as Village].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return data as Village;
  }

  async createCustomer(values: CustomerFormValues) {
    this.error.set(null);

    const user = this.currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const enrollmentWeekStart = monday.toISOString().split('T')[0];

    const paiseAmount = Math.round(Number(values.weekly_due_amount) * 100);
    const loanPaise = Math.round(Number(values.loan_amount) * 100);

    // Calculate amount_given from settings deduction
    const deductionPaise = Math.round(loanPaise * ((await this.getDeductionRate()) / 1000));
    const amountGivenPaise = loanPaise - deductionPaise;

    const { data: customer, error: customerError } = await this._supabaseService.client
      .from('customers')
      .insert({
        profile_id: user.id,
        name: values.name,
        phone: values.phone,
        email: values.email,
        weekly_due_amount: paiseAmount,
        status: 'active',
        outstanding_balance: 0,
        total_paid: 0,
        total_due: 0,
        enrollment_week_start: enrollmentWeekStart,
        enrollment_date: values.enrollment_date,
        village_id: values.village_id || null,
        loan_amount: loanPaise,
        amount_given: amountGivenPaise,
        total_weeks: values.total_weeks,
      })
      .select()
      .single();

    if (customerError) throw customerError;

    this.loadCustomers();
    return customer as Customer;
  }

  async updateCustomer(id: string, values: CustomerFormValues) {
    this.error.set(null);

    const paiseAmount = Math.round(Number(values.weekly_due_amount) * 100);
    const loanPaise = Math.round(Number(values.loan_amount) * 100);

    // Calculate amount_given from settings deduction
    const deductionPaise = Math.round(loanPaise * ((await this.getDeductionRate()) / 1000));
    const amountGivenPaise = loanPaise - deductionPaise;

    const { error } = await this._supabaseService.client
      .from('customers')
      .update({
        name: values.name,
        phone: values.phone,
        email: values.email,
        weekly_due_amount: paiseAmount,
        enrollment_date: values.enrollment_date,
        village_id: values.village_id || null,
        loan_amount: loanPaise,
        amount_given: amountGivenPaise,
        total_weeks: values.total_weeks,
      })
      .eq('id', id);

    if (error) throw error;

    this.loadCustomers();
  }

  async updateCustomerStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    this.error.set(null);
    const { error } = await this._supabaseService.client
      .from('customers')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    this.loadCustomers();
  }

  async deleteCustomer(id: string) {
    // Soft-delete: preserve posted payments/history by marking the customer inactive
    // instead of cascading deletes through payments, schedules and payment_history.
    await this.updateCustomerStatus(id, 'inactive');
  }

  private async getDeductionRate(): Promise<number> {
    try {
      const { data: settings } = await this._supabaseService.client
        .from('settings')
        .select('key, value')
        .in('key', ['loan_deduction_per_1000']);

      const settingsMap = new Map((settings || []).map((s: any) => [s.key, s.value]));
      const deductionRaw = settingsMap.get('loan_deduction_per_1000');
      const parsed = deductionRaw !== undefined ? parseInt(deductionRaw, 10) : 0;
      return [0, 10, 20, 30, 50].includes(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }
}
