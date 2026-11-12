import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);

  summary = signal<{
    totalCustomers: number;
    totalOutstanding: number;
    totalDue: number;
    totalPaid: number;
    thisWeekCollectible: number;
  } | null>(null);

  recentPayments = signal<any[]>([]);
  customerBalances = signal<any[]>([]);

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data: customers, error: customersError } = await this._supabaseService.client
        .from('customers')
        .select('outstanding_balance, total_due, total_paid');

      if (customersError) throw customersError;

      const summaryData = {
        totalCustomers: customers.length,
        totalOutstanding: customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
        totalDue: customers.reduce((sum, c) => sum + (c.total_due || 0), 0),
        totalPaid: customers.reduce((sum, c) => sum + (c.total_paid || 0), 0),
        thisWeekCollectible: 0,
      };

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
      thisWeekStart.setHours(0, 0, 0, 0);

      const { data: thisWeekSchedules } = await this._supabaseService.client
        .from('weekly_schedules')
        .select('due_amount')
        .eq('paid', false)
        .gte('due_date', thisWeekStart.toISOString().split('T')[0]);

      summaryData.thisWeekCollectible = thisWeekSchedules?.reduce((sum, s) => sum + (s.due_amount || 0), 0) || 0;

      this.summary.set(summaryData);

      const { data: payments, error: paymentsError } = await this._supabaseService.client
        .from('payment_history')
        .select('*, customers(name)')
        .order('payment_date', { ascending: false })
        .limit(50);

      if (paymentsError) throw paymentsError;
      this.recentPayments.set(payments as any[]);

      const { data: balances, error: balancesError } = await this._supabaseService.client
        .from('customers')
        .select('name, outstanding_balance, status')
        .order('outstanding_balance', { ascending: false })
        .limit(20);

      if (balancesError) throw balancesError;
      this.customerBalances.set(balances as any[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  }

  formatDate(date: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
