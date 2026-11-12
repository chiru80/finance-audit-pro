import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { COMMON_PIPES } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer } from './customer.types';
import { CollectionService } from '../collection.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [COMMON_PIPES, RouterLink],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css',
})
export class CustomerDetailComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _collectionService = inject(CollectionService);

  loading = signal(true);
  error = signal<string | null>(null);
  customer = signal<Customer | null>(null);
  paymentHistory = signal<any[]>([]);
  schedules = signal<any[]>([]);

  summary = computed(() => {
    const c = this.customer();
    return {
      outstanding_balance: c?.outstanding_balance ?? 0,
      total_due: c?.total_due ?? 0,
      total_paid: c?.total_paid ?? 0,
      weekly_due_amount: c?.weekly_due_amount ?? 0,
      enrollment_date: c?.enrollment_date ?? null,
    };
  });

  ngOnInit() {
    const id = this._router.getCurrentNavigation()?.extras?.state?.['id'];
    if (id) {
      this.loadCustomer(id);
    } else {
      this.error.set('Customer ID not provided');
      this.loading.set(false);
    }
  }

  private async loadCustomer(id: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        this.customer.set(data as Customer);
        await this.loadPaymentHistory(id);
        await this.loadSchedules(id);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPaymentHistory(customerId: string) {
    try {
      const data = await this._collectionService.getPaymentHistory(customerId);
      this.paymentHistory.set(data || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    }
  }

  private async loadSchedules(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client
        .from('weekly_schedules')
        .select('*')
        .eq('customer_id', customerId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      this.schedules.set(data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((amount || 0) / 100);
  }

  goBack() {
    this._router.navigate(['/customers']);
  }
}
