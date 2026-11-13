import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { formatPaiseToINR } from '../utils/currency.utils';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassInputDirective,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);

  startDate = signal<string>('');
  endDate = signal<string>('');
  activePreset = signal<'7d' | '30d' | 'this_month' | 'all'>('30d');

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
    this.setDatePreset('30d');
  }

  setDatePreset(preset: '7d' | '30d' | 'this_month' | 'all') {
    this.activePreset.set(preset);
    const end = new Date();
    const start = new Date();

    if (preset === '7d') {
      start.setDate(end.getDate() - 7);
      this.startDate.set(start.toISOString().split('T')[0]);
      this.endDate.set(end.toISOString().split('T')[0]);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 30);
      this.startDate.set(start.toISOString().split('T')[0]);
      this.endDate.set(end.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      start.setDate(1);
      this.startDate.set(start.toISOString().split('T')[0]);
      this.endDate.set(end.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      this.startDate.set('');
      this.endDate.set('');
    }

    this.loadReports();
  }

  async loadReports() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data: customers, error: customersError } = await this._supabaseService.client
        .from('customers')
        .select('id, name, outstanding_balance, total_due, total_paid, status');

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

      let paymentsQuery = this._supabaseService.client
        .from('payment_history')
        .select('*, customers(name)')
        .order('payment_date', { ascending: false });

      if (this.startDate()) {
        paymentsQuery = paymentsQuery.gte('payment_date', this.startDate());
      }
      if (this.endDate()) {
        paymentsQuery = paymentsQuery.lte('payment_date', this.endDate());
      }

      const { data: payments, error: paymentsError } = await paymentsQuery.limit(100);

      if (paymentsError) throw paymentsError;
      this.recentPayments.set(payments as any[]);

      const { data: balances, error: balancesError } = await this._supabaseService.client
        .from('customers')
        .select('id, name, phone, outstanding_balance, total_paid, status')
        .order('outstanding_balance', { ascending: false })
        .limit(50);

      if (balancesError) throw balancesError;
      this.customerBalances.set(balances as any[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      this.loading.set(false);
    }
  }

  exportPaymentsCSV() {
    const payments = this.recentPayments();
    if (!payments.length) return;

    const headers = ['Payment ID', 'Date', 'Customer', 'Amount (INR)', 'Method', 'Reference'];
    const rows = payments.map((p) => [
      p.id,
      p.payment_date,
      p.customers?.name || 'N/A',
      ((p.amount || 0) / 100).toFixed(2),
      p.payment_method,
      p.reference || '',
    ]);

    this.downloadCSV('payments_report.csv', [headers, ...rows]);
  }

  exportBalancesCSV() {
    const balances = this.customerBalances();
    if (!balances.length) return;

    const headers = ['Customer Name', 'Phone', 'Outstanding Balance (INR)', 'Total Paid (INR)', 'Status'];
    const rows = balances.map((c) => [
      c.name,
      c.phone || '',
      (c.outstanding_balance || 0) / 100,
      (c.total_paid || 0) / 100,
      c.status,
    ]);

    this.downloadCSV('customer_balances_report.csv', [headers, ...rows]);
  }

  private downloadCSV(filename: string, rows: (string | number)[][]) {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((row) => this.escapeCsvRow(row)).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escapeCsvRow(row: (string | number)[]): string {
    return row
      .map((cell) => {
        const value = String(cell ?? '');
        if (/[",\n\r]/.test(value) || value !== value.trim()) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  }

  formatCurrency(amount: number | bigint) {
    return formatPaiseToINR(amount || 0);
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
