import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Observable } from 'rxjs';

/**
 * All monetary fields below are integer paise, matching the rest of the app
 * (see currency.utils.ts). The presentation layer performs the single
 * paise -> rupee conversion via MoneyPipe / rupees().
 */
export interface DashboardStats {
  totalCustomers: number;
  todaysCollection: number;
  weeklyCollection: number;
  monthlyCollection: number;
  totalOutstanding: number;
  pendingPayments: number;
}

export interface Transaction {
  id: string;
  date: string;
  customer_name: string;
  amount: number;
  type: 'collection' | 'payment';
  status: 'paid' | 'pending';
  description?: string;
}

/** Explicit load lifecycle so callers never mistake a failed fetch for real zeros. */
export type LoadState<T> =
  { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; message: string };

type AggregateResult = {
  data: Array<Record<string, unknown>> | null;
  error: { message: string } | null;
  count?: number | null;
};

const STATS_ERROR = 'We could not load your dashboard figures. Please try again.';
const TRANSACTIONS_ERROR = 'We could not load recent transactions. Please try again.';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly _supabaseService = inject(SupabaseService);

  /**
   * Dashboard statistics in paise. Emits loading, then success or error so the
   * UI can show a retry instead of silently rendering zero-value figures.
   */
  getStats(): Observable<LoadState<DashboardStats>> {
    return new Observable((subscriber) => {
      subscriber.next({ status: 'loading' });

      const client = this._supabaseService.client;
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      Promise.all([
        this.countRows(client.from('customers').select('id', { count: 'exact', head: true })),
        this.sumColumn(
          client.from('transactions').select('amount').eq('date', dateStr).eq('type', 'collection'),
          'amount',
        ),
        this.sumColumn(
          client
            .from('transactions')
            .select('amount')
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .eq('type', 'collection'),
          'amount',
        ),
        this.sumColumn(
          client
            .from('transactions')
            .select('amount')
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .eq('type', 'collection'),
          'amount',
        ),
        this.sumColumn(
          client.from('customers').select('outstanding_balance'),
          'outstanding_balance',
        ),
        this.sumColumn(
          client.from('transactions').select('amount').eq('status', 'pending'),
          'amount',
        ),
      ])
        .then(
          ([
            totalCustomers,
            todaysCollection,
            weeklyCollection,
            monthlyCollection,
            totalOutstanding,
            pendingPayments,
          ]) => {
            subscriber.next({
              status: 'success',
              data: {
                totalCustomers,
                todaysCollection,
                weeklyCollection,
                monthlyCollection,
                totalOutstanding,
                pendingPayments,
              },
            });
            subscriber.complete();
          },
        )
        .catch((err) => {
          console.error('Dashboard stats error:', err);
          subscriber.next({ status: 'error', message: STATS_ERROR });
          subscriber.complete();
        });
    });
  }

  /**
   * Recent transactions with amounts in paise. Failures surface as an error
   * state rather than an empty list that looks like "no activity".
   */
  getRecentTransactions(limit: number = 10): Observable<LoadState<Transaction[]>> {
    return new Observable((subscriber) => {
      subscriber.next({ status: 'loading' });

      (async () => {
        try {
          const result = await this._supabaseService.client
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);

          if (result.error) {
            throw new Error(result.error.message);
          }

          const transactions: Transaction[] = (result.data ?? []).map(
            (t: Record<string, unknown>) => ({
              id: t['id'] as string,
              date: t['date'] as string,
              customer_name: t['customer_name'] as string,
              amount: Number(t['amount']) || 0,
              type: t['type'] as 'collection' | 'payment',
              status: t['status'] as 'paid' | 'pending',
              description: t['description'] as string | undefined,
            }),
          );

          subscriber.next({ status: 'success', data: transactions });
        } catch (err) {
          console.error('Recent transactions error:', err);
          subscriber.next({ status: 'error', message: TRANSACTIONS_ERROR });
        } finally {
          subscriber.complete();
        }
      })();
    });
  }

  /** A database error must not be treated as a zero/empty result. */
  private async sumColumn(query: PromiseLike<AggregateResult>, column: string): Promise<number> {
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).reduce((sum, row) => sum + (Number(row[column]) || 0), 0);
  }

  private async countRows(query: PromiseLike<AggregateResult>): Promise<number> {
    const { count, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return count ?? 0;
  }
}
