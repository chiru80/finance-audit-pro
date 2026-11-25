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
    notes: string = '',
  ) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('record_weekly_payment', {
        p_customer_id: customerId,
        p_amount_paise: amount_paise,
        p_method: method,
        p_reference: reference || null,
        p_notes: notes || null,
      });

      if (error) {
        if (this.isRpcTypeOrMissingError(error)) {
          return await this.recordPaymentDirectFallback(
            customerId,
            amount_paise,
            method,
            reference,
            notes,
          );
        }
        throw this.toError(error, 'Failed to record payment');
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (result && result.success === false) {
        throw new Error(result.error_message || 'Payment recording failed');
      }

      this.showSuccess('Payment recorded successfully');
      return { success: true, data: result };
    } catch (err) {
      const message = this.toError(err, 'Failed to record payment').message;
      return { success: false, error: message };
    }
  }

  async generateSchedulesForCustomer(customerId: string, weeksCount = 4) {
    try {
      const { data, error } = await this._supabaseService.client.rpc('generate_weekly_schedules', {
        p_customer_id: customerId,
        p_weeks_count: weeksCount,
      });

      if (error) {
        if (this.isRpcTypeOrMissingError(error)) {
          const created = await this.ensureSchedulesDirect(customerId, weeksCount);
          return { success: true, schedules_created: created };
        }
        throw this.toError(error, 'Failed to generate schedules');
      }

      const res = Array.isArray(data) ? data[0] : data;
      if (res && res.success === false) {
        throw new Error(res.error_message || 'Failed to generate schedules');
      }
      return { success: true, schedules_created: res?.schedules_created ?? weeksCount };
    } catch (err) {
      return {
        success: false,
        error: this.toError(err, 'Failed to generate schedules').message,
      };
    }
  }

  private isRpcTypeOrMissingError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const e = err as { code?: string; message?: string };
    return (
      e.code === '42804' ||
      e.code === 'PGRST202' ||
      !!e.message?.includes('does not match function result type')
    );
  }

  private async ensureSchedulesDirect(customerId: string, defaultWeeks = 12): Promise<number> {
    const client = this._supabaseService.client;
    const { data: existing, error: existingErr } = await client
      .from('weekly_schedules')
      .select('id, week_start_date')
      .eq('customer_id', customerId);

    if (existingErr) throw this.toError(existingErr, 'Failed to check weekly schedules');
    if (existing && existing.length > 0) return 0;

    const { data: cust, error: custErr } = await client
      .from('customers')
      .select('weekly_due_amount, total_weeks')
      .eq('id', customerId)
      .single();

    if (custErr) throw this.toError(custErr, 'Failed to load customer schedule terms');

    const dueAmount = Number((cust as any)?.weekly_due_amount || 0);
    const totalWeeks = Math.min(52, Math.max(1, Number((cust as any)?.total_weeks) || defaultWeeks));
    if (dueAmount <= 0) return 0;

    const now = new Date();
    const day = now.getDay();
    const daysUntilNextMonday = day === 1 ? 0 : (8 - day) % 7 || 7;
    const firstMonday = new Date(now);
    firstMonday.setDate(now.getDate() + daysUntilNextMonday);

    const rows = Array.from({ length: totalWeeks }, (_, idx) => {
      const start = new Date(firstMonday);
      start.setDate(firstMonday.getDate() + idx * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startIso = start.toISOString().split('T')[0];
      const endIso = end.toISOString().split('T')[0];
      return {
        customer_id: customerId,
        week_start_date: startIso,
        week_end_date: endIso,
        due_date: startIso,
        due_amount: dueAmount,
        paid: false,
        payment_id: null,
        absence_recorded: false,
        absence_approved: null,
      };
    });

    const { error: insertErr } = await client.from('weekly_schedules').insert(rows);
    if (insertErr) throw this.toError(insertErr, 'Failed to generate weekly schedules');
    return rows.length;
  }

  private async recordPaymentDirectFallback(
    customerId: string,
    amountPaise: number,
    method: 'cash' | 'online' | 'cheque' | 'other',
    reference: string,
    notes: string,
  ) {
    if (amountPaise <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const user = this._authService.user();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const client = this._supabaseService.client;
    await this.ensureSchedulesDirect(customerId, 12);

    const { data: payment, error: paymentErr } = await client
      .from('payments')
      .insert({
        customer_id: customerId,
        profile_id: user.id,
        amount: amountPaise,
        payment_method: method,
        reference: reference || null,
        payment_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (paymentErr) throw this.toError(paymentErr, 'Failed to record payment');

    const paymentId = (payment as { id: string }).id;
    const { data: unpaid, error: schedErr } = await client
      .from('weekly_schedules')
      .select('id, due_amount, due_date')
      .eq('customer_id', customerId)
      .eq('paid', false)
      .gt('due_amount', 0)
      .order('due_date', { ascending: true });

    if (schedErr) throw this.toError(schedErr, 'Failed to load unpaid schedules');

    let remaining = amountPaise;
    let allocatedTotal = 0;

    for (const sched of (unpaid || []) as Array<{ id: string; due_amount: number }>) {
      if (remaining <= 0) break;
      const alloc = Math.min(remaining, Number(sched.due_amount || 0));
      if (alloc <= 0) continue;

      const { error: allocErr } = await client.from('payment_allocations').insert({
        payment_id: paymentId,
        schedule_id: sched.id,
        amount: alloc,
      });
      if (allocErr) throw this.toError(allocErr, 'Failed to allocate payment');

      const { error: updErr } = await client
        .from('weekly_schedules')
        .update({
          paid: alloc >= sched.due_amount,
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sched.id);
      if (updErr) throw this.toError(updErr, 'Failed to update weekly schedule');

      remaining -= alloc;
      allocatedTotal += alloc;
    }

    this.showSuccess('Payment recorded successfully');
    return {
      success: true,
      data: {
        success: true,
        payment_id: paymentId,
        error_message: null,
        allocated_paise: allocatedTotal,
      },
    };
  }

  private toError(err: unknown, fallback: string): Error {
    if (err instanceof Error) return err;
    if (err && typeof err === 'object') {
      const e = err as { message?: string; details?: string; hint?: string };
      const parts = [e.message, e.details, e.hint].filter(Boolean);
      if (parts.length > 0) {
        return new Error(parts.join(' — '));
      }
    }
    return new Error(fallback);
  }

  async getCustomerPaymentSummary(customerId: string) {
    try {
      const { data, error } = await this._supabaseService.client.rpc(
        'get_customer_payment_summary',
        {
          p_customer_id: customerId,
        },
      );

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      return result as {
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
      const { data: history, error } = await this._supabaseService.client
        .from('payment_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const rows = (history || []) as any[];
      const paymentIds = rows.map((r) => r.original_payment_id).filter(Boolean);

      const allocationsByPayment = new Map<string, any[]>();
      if (paymentIds.length) {
        const { data: allocs, error: allocError } = await this._supabaseService.client
          .from('payment_allocations')
          .select(
            'id, amount, schedule_id, payment_id, weekly_schedules(week_start_date, due_date)',
          )
          .in('payment_id', paymentIds);

        if (allocError) throw allocError;
        for (const a of (allocs || []) as any[]) {
          if (!allocationsByPayment.has(a.payment_id)) allocationsByPayment.set(a.payment_id, []);
          allocationsByPayment.get(a.payment_id)!.push(a);
        }
      }

      return rows.map((r) => ({
        ...r,
        payment_allocations: allocationsByPayment.get(r.original_payment_id) || [],
      }));
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
