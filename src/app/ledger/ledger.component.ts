import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  private readonly _route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  payments = signal<LedgerPayment[]>([]);
  searchQuery = signal<string>('');
  customerSearch = signal<string>('');

  filteredCustomers = computed(() => {
    const list = this.customers();
    const q = this.customerSearch().toLowerCase().trim();
    if (!q) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  filteredPayments = computed(() => {
    if (!this.searchQuery()) return this.payments();
    const q = this.searchQuery().toLowerCase().trim();
    return this.payments().filter(p =>
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.id || '').toString().toLowerCase().includes(q) ||
      (p.payment_method || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q)
    );
  });

  totalCustomerPayments = computed(() => {
    return this.payments().reduce((sum, p) => sum + (p.amount || 0), 0);
  });

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      const list = data as Customer[];
      this.customers.set(list);

      // Check query param for customerId
      const qCid = this._route.snapshot.queryParamMap.get('customerId');
      if (qCid) {
        const found = list.find(c => c.id === qCid);
        if (found) {
          this.selectCustomer(found);
        }
      }
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

  exportCustomerLedgerCSV() {
    const cust = this.selectedCustomer();
    const payments = this.filteredPayments();
    if (!cust || !payments.length) return;

    const headers = ['Transaction ID', 'Date', 'Method', 'Amount (INR)', 'Weeks Covered', 'Reference / Note'];
    const rows = payments.map(p => [
      p.id,
      p.payment_date,
      p.payment_method,
      (p.amount / 100).toFixed(2),
      this.getAllocationCount(p),
      p.reference || p.notes || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${cust.name.replace(/\s+/g, '_')}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printLedger() {
    window.print();
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
