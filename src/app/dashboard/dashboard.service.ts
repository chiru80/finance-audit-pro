import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly _supabaseService = inject(SupabaseService);

  /**
   * Get dashboard statistics
   */
  getStats(): Observable<DashboardStats> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return new Observable((subscriber) => {
      // Try to fetch from Supabase
      Promise.all([
        this._supabaseService.client.from('customers').select('id', { count: 'exact', head: true }).then((r) => r.count || 0),
        this._supabaseService.client
          .from('transactions')
          .select('amount')
          .eq('date', dateStr)
          .eq('type', 'collection')
          .then((r) => r.data?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0),
        this._supabaseService.client
          .from('transactions')
          .select('amount')
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .eq('type', 'collection')
          .then((r) => r.data?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0),
        this._supabaseService.client
          .from('transactions')
          .select('amount')
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .eq('type', 'collection')
          .then((r) => r.data?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0),
        this._supabaseService.client
          .from('customers')
          .select('outstanding_balance')
          .then((r) => r.data?.reduce((sum: number, c: { outstanding_balance: number }) => sum + (c.outstanding_balance || 0), 0) || 0),
        this._supabaseService.client
          .from('transactions')
          .select('amount')
          .eq('status', 'pending')
          .then((r) => r.data?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0),
      ])
        .then(([totalCustomers, todaysCollection, weeklyCollection, monthlyCollection, totalOutstanding, pendingPayments]) => {
          subscriber.next({
            totalCustomers,
            todaysCollection: todaysCollection / 100, // Convert from paise to rupees for display
            weeklyCollection: weeklyCollection / 100,
            monthlyCollection: monthlyCollection / 100,
            totalOutstanding: totalOutstanding / 100,
            pendingPayments: pendingPayments / 100,
          });
          subscriber.complete();
        })
        .catch((err) => {
          console.error('Dashboard stats error:', err);
          // Return zeros on error
          subscriber.next({
            totalCustomers: 0,
            todaysCollection: 0,
            weeklyCollection: 0,
            monthlyCollection: 0,
            totalOutstanding: 0,
            pendingPayments: 0,
          });
          subscriber.complete();
        });
    });
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const result = await this._supabaseService.client
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);

          const transactions: Transaction[] =
            result.data?.map((t: Record<string, unknown>) => ({
              id: t['id'] as string,
              date: t['date'] as string,
              customer_name: t['customer_name'] as string,
              amount: (t['amount'] as number) / 100, // Convert from paise to rupees for display
              type: (t['type'] as string) as 'collection' | 'payment',
              status: (t['status'] as string) as 'paid' | 'pending',
              description: t['description'] as string | undefined,
            })) || [];
          subscriber.next(transactions);
          subscriber.complete();
        } catch (err) {
          console.error('Recent transactions error:', err);
          subscriber.next([]);
          subscriber.complete();
        }
      })();
    });
  }
}