import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { Customer } from './customer.types';
import { formatPaiseToINR } from '../utils/currency.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassInputDirective,
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
})
export class CustomerListComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  readonly _router = inject(Router);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  statusFilter = signal<'all' | 'active' | 'outstanding' | 'inactive'>('all');

  totalCustomers = computed(() => this.customers().length);
  activeCustomers = computed(() => this.customers().filter(c => c.status === 'active').length);
  totalOutstanding = computed(() => this.customers().reduce((sum, c) => sum + (c.outstanding_balance || 0), 0));
  avgWeeklyDue = computed(() => {
    const list = this.customers();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, c) => sum + (c.weekly_due_amount || 0), 0) / list.length);
  });

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      this.customers.set(data as Customer[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  createCustomer() {
    this._router.navigate(['/customers/new']);
  }

  editCustomer(id: string) {
    this._router.navigate(['/customers', id, 'edit']);
  }

  viewCustomer(customer: Customer) {
    this._router.navigate(['/customers', customer.id], { state: { id: customer.id } });
  }

  recordCollection(customer: Customer) {
    this._router.navigate(['/collections'], { queryParams: { customerId: customer.id } });
  }

  viewLedger(customer: Customer) {
    this._router.navigate(['/ledger'], { queryParams: { customerId: customer.id } });
  }

  async deleteCustomer(id: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const { error } = await this._supabaseService.client
          .from('customers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        this.loadCustomers();
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : 'Failed to delete customer');
      }
    }
  }

  getFilteredCustomers() {
    let list = this.customers();

    // Apply status filter
    const sf = this.statusFilter();
    if (sf === 'active') {
      list = list.filter(c => c.status === 'active');
    } else if (sf === 'outstanding') {
      list = list.filter(c => (c.outstanding_balance || 0) > 0);
    } else if (sf === 'inactive') {
      list = list.filter(c => c.status !== 'active');
    }

    // Apply search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.phone || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query)
      );
    }

    return list;
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  formatCurrency(amount: number | bigint): string {
    return formatPaiseToINR(amount || 0);
  }
}
