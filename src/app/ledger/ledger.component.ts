import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer } from '../customers/customer.types';
import { CollectionService } from '../collection.service';
import { formatPaiseToINR } from '../utils/currency.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

export interface LedgerPayment {
  id: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  customer_name?: string;
  customer_id?: string;
  reversed?: boolean;
  reference?: string;
  notes?: string;
  allocations?: Array<{ schedule_id: string; amount: number; week_start_date?: string }>;
}

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassInputDirective,
  ],
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.css',
})
export class LedgerComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _collectionService = inject(CollectionService);

  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  payments = signal<LedgerPayment[]>([]);
  searchQuery = signal<string>('');

  filteredPayments = computed(() => {
    if (!this.searchQuery()) return this.payments();
    const q = this.searchQuery().toLowerCase();
    return this.payments().filter(p =>
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.id || '').toString().toLowerCase().includes(q) ||
      (p.payment_method || '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadCustomers();
  }

  private async loadCustomers() {
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      this.customers.set(data as Customer[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  async selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    await this.loadPayments(customer.id);
  }

  private async loadPayments(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client
        .from('payment_history')
        .select(`
          *,
          payment_allocations (
            id,
            amount,
            schedule_id,
            weekly_schedules ( week_start_date )
          )
        `)
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const payments: LedgerPayment[] = (data || []).map((p: any) => ({
        id: p.id,
        payment_date: p.payment_date,
        payment_method: p.payment_method,
        amount: p.amount,
        customer_name: p.customer_name,
        customer_id: p.customer_id,
        reversed: p.reversed,
        reference: p.reference,
        notes: p.notes,
        allocations: (p.payment_allocations || []).map((a: any) => ({
          schedule_id: a.schedule_id,
          amount: a.amount,
          week_start_date: a.weekly_schedules?.week_start_date,
        })),
      }));

      this.payments.set(payments);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load payments');
    }
  }

  formatCurrency(amount: number | bigint): string {
    return formatPaiseToINR(amount || 0);
  }

  getAllocationCount(payment: LedgerPayment): number {
    return (payment.allocations || []).length;
  }

  clearSelection() {
    this.selectedCustomer.set(null);
    this.payments.set([]);
  }
}
