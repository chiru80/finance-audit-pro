import type { OnInit } from '@angular/core';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { IndexedDbService } from '../core/indexed-db.service';
import type { Customer, Village } from './customer.types';
import { formatPaiseToINR } from '../utils/currency.utils';
import { I18nService } from '../shared/i18n.service';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { I18nPipe } from '../shared/i18n.pipe';

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
    I18nPipe,
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
})
export class CustomerListComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _i18n = inject(I18nService);
  private readonly idb = inject(IndexedDbService);

  customers = signal<Customer[]>([]);
  villages = signal<Village[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  statusFilter = signal<'all' | 'active' | 'outstanding' | 'inactive' | 'suspended'>('all');
  villageFilter = signal<string>('all');

  selectedVillage = computed(
    () => this.villages().find((v) => v.id === this.villageFilter()) || null,
  );

  totalCustomers = computed(() => this.customers().length);
  activeCustomers = computed(() => this.customers().filter((c) => c.status === 'active').length);
  totalOutstanding = computed(() =>
    this.customers().reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
  );
  avgWeeklyDue = computed(() => {
    const list = this.customers();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, c) => sum + (c.weekly_due_amount || 0), 0) / list.length);
  });

  ngOnInit() {
    const qVillageId = this._route.snapshot.queryParamMap.get('villageId');
    if (qVillageId) {
      this.villageFilter.set(qVillageId);
    }
    this.loadCustomers();
  }

  async loadCustomers() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [custRes, villageRes] = await Promise.all([
        this._supabaseService.client
          .from('customers')
          .select(
            `
          *,
          villages(name)
        `,
          )
          .order('name', { ascending: true }),
        this._supabaseService.client
          .from('villages')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      if (custRes.error) throw custRes.error;
      const list = (custRes.data || []) as Customer[];
      this.customers.set(list);
      if (!villageRes.error && villageRes.data) {
        this.villages.set(villageRes.data as Village[]);
      }
      await this.idb.put('cache', { key: 'customers:all', value: list, ts: Date.now() });
    } catch (err) {
      const cached = await this.idb.get<{ key: string; value: Customer[] }>(
        'cache',
        'customers:all',
      );
      if (cached?.value?.length) {
        this.customers.set(cached.value);
        this.error.set('Showing cached customers (offline).');
      } else {
        this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
      }
    } finally {
      this.loading.set(false);
    }
  }

  createCustomer() {
    const vf = this.villageFilter();
    if (vf && vf !== 'all' && vf !== 'unassigned') {
      this._router.navigate(['/customers/new'], { queryParams: { villageId: vf } });
    } else {
      this._router.navigate(['/customers/new']);
    }
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
    if (confirm(this._i18n.get('customers.confirm_delete'))) {
      this.error.set(null);
      try {
        const { error } = await this._supabaseService.client
          .from('customers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        const updated = this.customers().filter((c) => c.id !== id);
        this.customers.set(updated);
        await this.idb.put('cache', { key: 'customers:all', value: updated, ts: Date.now() });
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
      list = list.filter((c) => c.status === 'active');
    } else if (sf === 'outstanding') {
      list = list.filter((c) => (c.outstanding_balance || 0) > 0);
    } else if (sf === 'inactive') {
      list = list.filter((c) => c.status !== 'active');
    } else if (sf === 'suspended') {
      list = list.filter((c) => c.status === 'suspended');
    }

    // Apply village filter
    const vf = this.villageFilter();
    if (vf === 'unassigned') {
      list = list.filter((c) => !c.village_id);
    } else if (vf !== 'all') {
      list = list.filter((c) => c.village_id === vf);
    }

    // Apply search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query),
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

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      active: this._i18n.get('status.active'),
      inactive: this._i18n.get('status.inactive'),
      suspended: this._i18n.get('status.suspended'),
      pending: this._i18n.get('status.pending'),
      overdue: this._i18n.get('status.overdue'),
      paid: this._i18n.get('status.paid'),
    };
    return statusMap[status] || this._i18n.get('status.active');
  }
}
