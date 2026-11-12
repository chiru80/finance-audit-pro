import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer, CustomerFormValues } from './customer.types';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  readonly currentUser = computed(() => this._authService.user());

  customers = signal<Customer[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      this.customers.set(data as Customer[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  async createCustomer(values: CustomerFormValues) {
    this.error.set(null);

    const user = this.currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: customer, error: customerError } = await this._supabaseService.client
      .from('customers')
      .insert({
        profile_id: user.id,
        name: values.name,
        phone: values.phone,
        email: values.email,
        weekly_due_amount: values.weekly_due_amount,
        status: 'active',
        outstanding_balance: 0,
        total_paid: 0,
        total_due: values.weekly_due_amount,
      })
      .select()
      .single();

    if (customerError) throw customerError;

    this.loadCustomers();
    return customer as Customer;
  }

  async updateCustomer(id: string, values: CustomerFormValues) {
    this.error.set(null);

    const { error } = await this._supabaseService.client
      .from('customers')
      .update({
        name: values.name,
        phone: values.phone,
        email: values.email,
        weekly_due_amount: values.weekly_due_amount,
      })
      .eq('id', id);

    if (error) throw error;

    this.loadCustomers();
  }

  async deleteCustomer(id: string) {
    this.error.set(null);

    const { error } = await this._supabaseService.client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.loadCustomers();
  }
}
