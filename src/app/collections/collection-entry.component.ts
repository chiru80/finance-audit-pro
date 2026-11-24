import type { OnInit } from '@angular/core';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { OfflineStatusService } from '../core/offline-status.service';
import { OutboxService } from '../core/outbox.service';
import { IndexedDbService } from '../core/indexed-db.service';
import type { Customer } from '../customers/customer.types';
import { WeeklyTrackerComponent } from './weekly-tracker.component';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import type { GlassTabItem } from '../design-system/components/glass-tabs.component';
import { GlassTabsComponent } from '../design-system/components/glass-tabs.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { formatPaiseToINR } from '../utils/currency.utils';
import { I18nPipe } from '../shared/i18n.pipe';

@Component({
  selector: 'app-collection-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    WeeklyTrackerComponent,
    GlassCardComponent,
    GlassButtonComponent,
    GlassTabsComponent,
    GlassInputDirective,
    I18nPipe,
  ],
  templateUrl: './collection-entry.component.html',
  styleUrls: ['./collection-entry.component.css'],
})
export class CollectionEntryComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);
  protected readonly offlineStatus = inject(OfflineStatusService);
  private readonly outbox = inject(OutboxService);
  private readonly idb = inject(IndexedDbService);

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

  selectedCustomerObj = computed(() => {
    const id = this.selectedCustomer();
    if (!id) return null;
    return this.customers().find((c) => c.id === id) || null;
  });

  paymentMethods: ('cash' | 'online' | 'cheque' | 'other')[] = [
    'cash',
    'online',
    'cheque',
    'other',
  ];

  tabs: GlassTabItem[] = [
    { id: 'record', label: 'Record Collection' },
    { id: 'tracker', label: 'Weekly Tracker & Absences' },
  ];

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
      const list = data as Customer[];
      this.customers.set(list);
      this.customersLoaded.set(true);
      // Cache for offline use
      await this.idb.put('cache', { key: 'customers:active', value: list, ts: Date.now() });

      // Check if customerId is passed via query params
      const qCid = this._route.snapshot.queryParamMap.get('customerId');
      if (qCid) {
        const match = list.find((c) => c.id === qCid);
        if (match) {
          this.selectedCustomer.set(match.id);
          this.amountInRupees.set(Math.round(match.weekly_due_amount / 100));
        }
      }
    } catch (err) {
      // Fall back to cached data when offline/unreachable
      const cached = await this.idb.get<{ key: string; value: Customer[] }>('cache', 'customers:active');
      if (cached?.value?.length) {
        this.customers.set(cached.value);
        this.customersLoaded.set(true);
        this.error.set('Showing cached customers (offline).');
      } else {
        this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
      }
    } finally {
      this.loading.set(false);
    }
  }

  onCustomerSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const cid = target.value;
    this.selectedCustomer.set(cid);
    this.reference.set('');
    this.notes.set('');
    this.error.set(null);
    this.success.set(null);

    const match = this.customers().find((c) => c.id === cid);
    if (match) {
      this.amountInRupees.set(Math.round(match.weekly_due_amount / 100));
    } else {
      this.amountInRupees.set(0);
    }
  }

  setAmount(amt: number) {
    this.amountInRupees.set(amt);
  }

  async collectPayment() {
    if (!this.selectedCustomer() || this.amountInRupees() <= 0) {
      this.error.set('Please select a customer and enter a valid collection amount.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      const customerId = this.selectedCustomer();
      const amountPaise = Math.round(this.amountInRupees() * 100);
      const customer = this.selectedCustomerObj();

      // Offline: queue for later sync instead of hitting the network.
      if (!this.offlineStatus.isOnline()) {
        await this.outbox.enqueue({
          customerId,
          customerName: customer?.name,
          amountPaise,
          method: this.selectedMethod(),
          reference: this.reference() || null,
          notes: this.notes() || null,
        });
        const collectedRupees = this.amountInRupees();
        this.amountInRupees.set(0);
        this.reference.set('');
        this.notes.set('');
        this.success.set(
          `Saved offline: ₹${collectedRupees.toFixed(2)} queued for sync when connection returns.`,
        );
        setTimeout(() => this.success.set(null), 5000);
        return;
      }

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

      const collectedRupees = this.amountInRupees();
      this.amountInRupees.set(0);
      this.reference.set('');
      this.notes.set('');

      this.success.set(`Successfully recorded collection of ₹${collectedRupees.toFixed(2)}.`);
      await this.loadCustomers();

      setTimeout(() => this.success.set(null), 4000);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(paise: number | bigint): string {
    return formatPaiseToINR(paise || 0);
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
