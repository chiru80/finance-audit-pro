import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer } from '../customers/customer.types';
import { WeeklyTrackerComponent } from './weekly-tracker.component';

@Component({
  selector: 'app-collection-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, WeeklyTrackerComponent],
  templateUrl: './collection-entry.component.html',
  styleUrls: ['./collection-entry.component.css'],
})
export class CollectionEntryComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  activeTab = signal<'record' | 'tracker'>('record');
  loading = signal(true);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  selectedCustomer = signal<string>('');
  selectedMethod = signal<'cash' | 'online' | 'cheque' | 'other'>('cash');
  amountInRupees = signal<number>(0);
  reference = signal<string>('');
  notes = signal<string>('');
  customersLoaded = signal(false);
  success = signal<string | null>(null);

  paymentMethods: ('cash' | 'online' | 'cheque' | 'other')[] = ['cash', 'online', 'cheque', 'other'];

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      this.customers.set(data as Customer[]);
      this.customersLoaded.set(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  onCustomerSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCustomer.set(target.value);
    this.amountInRupees.set(0);
    this.reference.set('');
    this.notes.set('');
    this.error.set(null);
    this.success.set(null);
  }

  async collectPayment() {
    if (!this.selectedCustomer() || this.amountInRupees() <= 0) {
      this.error.set('Please select a customer and enter a valid amount');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      const customerId = this.selectedCustomer();
      const amountPaise = Math.round(this.amountInRupees() * 100);

      const { data, error } = await this._supabaseService.client.rpc('record_weekly_payment', {
        p_customer_id: customerId,
        p_amount_paise: amountPaise,
        p_method: this.selectedMethod(),
        p_reference: this.reference() || null,
        p_notes: this.notes() || null,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (result && result.success === false) {
        throw new Error(result.error_message || 'Payment recording failed');
      }

      this.amountInRupees.set(0);
      this.reference.set('');
      this.notes.set('');

      this.success.set('Payment recorded successfully');
      this.loadCustomers();

      setTimeout(() => this.success.set(null), 3000);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      this.loading.set(false);
    }
  }

  getFormattedAmount(): string {
    const amt = this.amountInRupees();
    return amt ? `₹${amt.toFixed(2)}` : '₹0.00';
  }
}
