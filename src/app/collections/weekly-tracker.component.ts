import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CollectionService } from '../collection.service';
import { Customer } from '../customers/customer.types';
import { formatPaiseToINR } from '../utils/currency.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

@Component({
  selector: 'app-weekly-tracker',
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
  templateUrl: './weekly-tracker.component.html',
  styleUrls: ['./weekly-tracker.component.css'],
})
export class WeeklyTrackerComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _collectionService = inject(CollectionService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  customerId = signal<string | null>(null);
  schedules = signal<any[]>([]);
  selectedCustomerName = signal<string>('');

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
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customers');
    }
  }

  onCustomerChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const id = target.value;
    if (id) {
      this.customerId.set(id);
      this.loadSchedules(id);
    } else {
      this.customerId.set(null);
      this.schedules.set([]);
      this.selectedCustomerName.set('');
    }
  }

  async generateSchedules() {
    const cid = this.customerId();
    if (!cid) {
      this.error.set('Please select a customer first');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this._supabaseService.client.rpc('generate_weekly_schedules', {
        p_customer_id: cid,
        p_weeks_count: 4,
      });

      if (error) throw error;
      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Failed to generate schedules');
      }

      this.success.set('Generated weekly schedules for the next 4 weeks.');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to generate schedules');
    } finally {
      this.loading.set(false);
    }
  }

  async collectForWeek(scheduleId: string) {
    const cid = this.customerId();
    if (!cid) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const schedule = this.schedules().find((s) => s.id === scheduleId);

      // The schedule.due_amount should always be set - it comes from customer's weekly_due_amount
      // or was generated with the proper amount. Throw an error if it's missing.
      if (schedule?.due_amount === undefined || schedule?.due_amount === null) {
        throw new Error('Schedule due amount is not set - please generate schedules first');
      }
      const amountPaise = schedule.due_amount;

      const { data, error } = await this._supabaseService.client.rpc('record_weekly_payment', {
        p_customer_id: cid,
        p_amount_paise: amountPaise,
        p_method: 'cash',
        p_reference: null,
        p_notes: `Payment for schedule ${scheduleId}`,
      });

      if (error) throw error;
      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Payment recording failed');
      }

      this.success.set('Collection recorded successfully');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to collect payment');
    } finally {
      this.loading.set(false);
    }
  }

  async markAbsent(schedule: any) {
    const cid = this.customerId();
    if (!cid) return;

    const reason = window.prompt('Enter reason for customer absence:', 'Customer was unavailable') ?? '';
    if (!reason) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this._supabaseService.client.rpc('record_absence', {
        p_customer_id: cid,
        p_week_start: schedule.week_start_date,
        p_reason: reason,
      });

      if (error) throw error;
      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Failed to record absence');
      }

      // Auto-approve the absence (as Owner) to finalize documentation
      // Under Option A, due remains charged and carries forward
      const absenceId = res.absence_id;
      if (absenceId) {
        await this._supabaseService.client.rpc('approve_absence', {
          p_absence_id: absenceId,
          p_approve: true,
        });
      }

      this.success.set('Absence recorded and approved. Due is carried forward as debt.');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to mark absence');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSchedules(customerId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.schedules.set([]);

    try {
      const { data, error } = await this._supabaseService.client
        .from('weekly_schedules')
        .select(`
          *,
          customers!inner(name, phone)
        `)
        .eq('customer_id', customerId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      this.schedules.set(data as any[]);
      const customer = this.customers().find((c) => c.id === customerId);
      this.selectedCustomerName.set(customer?.name || (data[0]?.customers as any)?.name || '');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      this.loading.set(false);
    }
  }

  formatPaise(paise: number): string {
    return formatPaiseToINR(paise);
  }
}
