import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CollectionService } from '../collection.service';

@Component({
  selector: 'app-weekly-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-tracker.component.html',
  styleUrl: './weekly-tracker.component.css',
})
export class WeeklyTrackerComponent {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _collectionService = inject(CollectionService);

  loading = signal(true);
  error = signal<string | null>(null);
  customerId = signal<string | null>(null);
  schedules = signal<any[]>([]);
  selectedCustomerName = signal<string>('');

  async generateSchedules() {
    if (!this.customerId()) {
      this.error.set('Please select a customer first');
      return;
    }
    try {
      const { error } = await this._supabaseService.client.rpc('generate_weekly_schedules', {
        p_customer_id: this.customerId(),
        p_weeks_count: 4,
      });
      if (error) throw error;
      await this.loadSchedules(this.customerId()!);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to generate schedules');
    }
  }

  async collectForWeek(scheduleId: string) {
    try {
      const { error } = await this._supabaseService.client.rpc('record_weekly_payment', {
        p_customer_id: this.customerId(),
        p_amount_paise: 50000,
        p_method: 'cash',
        p_reference: null,
        p_notes: null,
      });
      if (error) throw error;
      if (this.customerId()) {
        await this.loadSchedules(this.customerId()!);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to collect payment');
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
      this.selectedCustomerName.set((data[0]?.customers as any)?.name || '');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusColor(status: boolean): string {
    return status ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Paid' : 'Unpaid';
  }
}
