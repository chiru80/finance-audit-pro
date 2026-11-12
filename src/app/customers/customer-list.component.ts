import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { Customer } from './customer.types';
import { formatPaiseToINR } from '../utils/currency.utils';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
    if (!this.searchQuery()) return this.customers();
    const query = this.searchQuery().toLowerCase();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query)
    );
  }

  formatCurrency(amount: number | bigint): string {
    return formatPaiseToINR(amount || 0);
  }
}
