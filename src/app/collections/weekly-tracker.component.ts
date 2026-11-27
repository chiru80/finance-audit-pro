import type { OnInit } from '@angular/core';
import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '../shared/i18n.pipe';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CollectionService } from '../collection.service';
import type { Customer } from '../customers/customer.types';
import { formatPaiseToINR } from '../utils/currency.utils';
import { extractErrorMessage } from '../utils/error.utils';
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
    I18nPipe,
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
  markingAbsentScheduleId = signal<string | null>(null);
  absenceReason = '';

  @Input() set initialCustomerId(id: string | null | undefined) {
    if (id && id !== this.customerId()) {
      this.customerId.set(id);
      this.loadSchedules(id);
    }
  }

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
      const cid = this.customerId();
      if (cid) {
        const match = (data as Customer[]).find((c) => c.id === cid);
        if (match?.name) {
          this.selectedCustomerName.set(match.name);
        }
      }
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to load customers'));
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
      const res = await this._collectionService.generateSchedulesForCustomer(cid, 4);
      if (!res.success) {
        throw new Error(res.error || 'Failed to generate schedules');
      }

      this.success.set('Generated weekly schedules for the next 4 weeks.');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to generate schedules'));
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

      const res = await this._collectionService.recordWeeklyPayment(
        cid,
        amountPaise,
        'cash',
        '',
        `Payment for schedule ${scheduleId}`,
      );

      if (!res.success) {
        throw new Error(res.error || 'Payment recording failed');
      }

      this.success.set('Collection recorded successfully');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to collect payment'));
    } finally {
      this.loading.set(false);
    }
  }

  startMarkAbsent(schedule: any) {
    this.error.set(null);
    this.markingAbsentScheduleId.set(schedule.id);
    this.absenceReason = 'Customer was unavailable';
  }

  cancelMarkAbsent() {
    this.markingAbsentScheduleId.set(null);
    this.absenceReason = '';
  }

  async confirmMarkAbsent(schedule: any) {
    const cid = this.customerId();
    const reason = this.absenceReason.trim();
    if (!cid || !reason || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await this._collectionService.recordAbsence(cid, schedule.week_start_date, reason);
      if (!res.success) {
        throw new Error(res.error || 'Failed to record absence');
      }

      this.cancelMarkAbsent();
      // Server applies absence_requires_approval setting; owner can approve/reject
      // pending absences from the customer detail page.
      this.success.set('Absence recorded. Owner approval may be required per settings.');
      setTimeout(() => this.success.set(null), 3000);
      await this.loadSchedules(cid);
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to mark absence'));
    } finally {
      this.loading.set(false);
    }
  }

  async markAbsent(schedule: any) {
    this.startMarkAbsent(schedule);
  }

  async loadSchedules(customerId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.schedules.set([]);

    try {
      const { data, error } = await this._supabaseService.client
        .from('weekly_schedules')
        .select(
          `
          *,
          customers!inner(name, phone)
        `,
        )
        .eq('customer_id', customerId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      this.schedules.set(data as any[]);
      const customer = this.customers().find((c) => c.id === customerId);
      this.selectedCustomerName.set(customer?.name || (data[0]?.customers as any)?.name || '');
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to load schedules'));
    } finally {
      this.loading.set(false);
    }
  }

  formatPaise(paise: number): string {
    return formatPaiseToINR(paise);
  }
}
