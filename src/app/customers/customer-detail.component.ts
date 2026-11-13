import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { Customer } from './customer.types';
import { CollectionService } from '../collection.service';
import { formatPaiseToINR } from '../utils/currency.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassTabsComponent, GlassTabItem } from '../design-system/components/glass-tabs.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassTabsComponent,
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css'],
})
export class CustomerDetailComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _collectionService = inject(CollectionService);

  loading = signal(true);
  error = signal<string | null>(null);
  customer = signal<Customer | null>(null);
  paymentHistory = signal<any[]>([]);
  schedules = signal<any[]>([]);
  absences = signal<any[]>([]);
  activeTab = signal<'schedules' | 'payments' | 'absences'>('schedules');

  get detailTabs(): GlassTabItem[] {
    return [
      { id: 'schedules', label: 'Weekly Schedules', badge: this.schedules().length },
      { id: 'payments', label: 'Payment Ledger', badge: this.paymentHistory().length },
      { id: 'absences', label: 'Absence History', badge: this.absences().length },
    ];
  }

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
    const routeId = this._route.snapshot.paramMap.get('id');
    const stateId = (this._router.getCurrentNavigation()?.extras?.state as Record<string, unknown> | undefined)?.['id'] as string | undefined;
    const id = routeId || stateId;

    if (id) {
      this.loadCustomer(id);
    } else {
      this.error.set('Customer ID not provided');
      this.loading.set(false);
    }
  }

  setActiveTab(tab: 'schedules' | 'payments' | 'absences') {
    this.activeTab.set(tab);
  }

  recordPayment() {
    const c = this.customer();
    if (c) {
      this._router.navigate(['/collections'], { queryParams: { customerId: c.id } });
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
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
        await Promise.all([
          this.loadPaymentHistory(id),
          this.loadSchedules(id),
          this.loadAbsences(id),
        ]);
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
      const data = await this._collectionService.getWeeklySchedules(customerId);
      this.schedules.set(data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  }

  private async loadAbsences(customerId: string) {
    try {
      const data = await this._collectionService.getCustomerAbsences(customerId);
      this.absences.set(data || []);
    } catch (err) {
      console.error('Failed to load absences:', err);
    }
  }

  formatCurrency(amount: number | bigint) {
    return formatPaiseToINR(amount || 0);
  }

  goBack() {
    this._router.navigate(['/customers']);
  }
}
