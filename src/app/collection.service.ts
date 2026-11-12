import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  success = signal<string | null>(null);

  showSuccess(message: string) {
    this.success.set(message);
    setTimeout(() => this.success.set(null), 3000);
  }

  async recordWeeklyPayment(
    customerId: string,
    amount_paise: number,
    method: 'cash' | 'online' | 'cheque' | 'other',
    reference: string = '',
    notes: string = ''
  ) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('record_weekly_payment', {
        p_customer_id: customerId,
        p_amount_paise: amount_paise,
        p_method: method,
        p_reference: reference || null,
        p_notes: notes || null,
      });

      if (error) throw error;

      this.showSuccess('Payment recorded successfully');
      return { success: true, data };
    } catch (err) {
      this.showSuccess(err instanceof Error ? err.message : 'Failed to record payment');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async getCustomerPaymentSummary(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('get_customer_payment_summary', {
        p_customer_id: customerId
      });

      if (error) throw error;
      return data as {
        success: boolean;
        outstanding_balance: number;
        total_due: number;
        total_paid: number;
        next_due_date: string | null;
        next_due_amount: number;
        error_message: string | null;
      };
    } catch (err) {
      console.error('Failed to get payment summary:', err);
      return null;
    }
  }

  async getPaymentHistory(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client
        .from('payment_history')
        .select(`
          *,
          payment_allocations (
            id,
            amount,
            schedule_id,
            weekly_schedules (
              week_start_date,
              due_date
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to get payment history:', err);
      return [];
    }
  }

  async recordAbsence(customerId: string, weekStartDate: string, reason: string) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('record_absence', {
        p_customer_id: customerId,
        p_week_start: weekStartDate,
        p_reason: reason,
      });

      if (error) throw error;
      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Failed to record absence');
      }

      this.showSuccess('Absence recorded');
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async approveAbsence(absenceId: string, approve: boolean = true) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('approve_absence', {
        p_absence_id: absenceId,
        p_approve: approve,
      });

      if (error) throw error;
      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Failed to update absence approval');
      }

      this.showSuccess(approve ? 'Absence approved' : 'Absence rejected');
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async getCustomerAbsences(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client
        .from('absences')
        .select('*')
        .eq('customer_id', customerId)
        .order('week_start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to get absences:', err);
      return [];
    }
  }

  async getWeeklySchedules(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client
        .from('weekly_schedules')
        .select('*')
        .eq('customer_id', customerId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to get schedules:', err);
      return [];
    }
  }
}
