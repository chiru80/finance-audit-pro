import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { StatCardComponent } from '../shared/stat-card.component';
import { MoneyPipe } from '../shared/money-pipe';
import { I18nPipe } from '../shared/i18n.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, MoneyPipe, I18nPipe],
  template: `
    <div class="dashboard max-w-7xl mx-auto space-y-8">
      <!-- Header Banner / Title -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-brand-900">{{ 'dashboard.title' | i18n }}</h1>
          <p class="text-sm text-slate-500 mt-1">Real-time collections, dues, and audit performance overview.</p>
        </div>

        <!-- Header Quick Action buttons -->
        <div class="flex items-center gap-2.5">
          <a
            [routerLink]="['/collections']"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-600 shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'dashboard.add_collection' | i18n }}
          </a>
          <a
            [routerLink]="['/customers']"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'dashboard.add_customer' | i18n }}
          </a>
          <a
            [routerLink]="['/reports']"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ 'dashboard.view_reports' | i18n }}
          </a>
        </div>
      </div>

      <!-- Stats Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-stat-card
          [label]="'dashboard.total_customers' | i18n"
          [value]="(stats$ | async)?.totalCustomers ?? 0"
          [color]="'primary'"
          [icon]="dashboardIcons.customers"
        />
        <app-stat-card
          [label]="'dashboard.todays_collection' | i18n"
          [value]="(stats$ | async)?.todaysCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [suffix]="' today'"
          [icon]="dashboardIcons.collection"
        />
        <app-stat-card
          [label]="'dashboard.weekly_collection' | i18n"
          [value]="(stats$ | async)?.weeklyCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [icon]="dashboardIcons.weekly"
        />
        <app-stat-card
          [label]="'dashboard.monthly_collection' | i18n"
          [value]="(stats$ | async)?.monthlyCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [icon]="dashboardIcons.monthly"
        />
        <app-stat-card
          [label]="'dashboard.total_outstanding' | i18n"
          [value]="(stats$ | async)?.totalOutstanding ?? 0"
          [prefix]="'₹'"
          [color]="'warning'"
          [icon]="dashboardIcons.outstanding"
        />
        <app-stat-card
          [label]="'dashboard.pending_payments' | i18n"
          [value]="(stats$ | async)?.pendingPayments ?? 0"
          [prefix]="'₹'"
          [color]="'warning'"
          [icon]="dashboardIcons.pending"
        />
      </div>

      <!-- Recent Transactions -->
      <div class="bg-background-primary border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-background-primary">
          <div class="flex items-center gap-2.5">
            <div class="w-2.5 h-2.5 rounded-full bg-accent-600"></div>
            <h2 class="text-base font-semibold text-brand-900">{{ 'dashboard.recent_transactions' | i18n }}</h2>
          </div>
          <a
            [routerLink]="['/ledger']"
            class="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors"
          >
            <span>View Full Ledger</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-100">
                <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ 'dashboard.date' | i18n }}</th>
                <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ 'dashboard.customer' | i18n }}</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ 'dashboard.amount' | i18n }}</th>
                <th class="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ 'dashboard.status_label' | i18n }}</th>
                <th class="px-6 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (transaction of transactions$ | async; track transaction.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-6 py-4 text-sm text-slate-600 font-medium">{{ transaction.date }}</td>
                  <td class="px-6 py-4 text-sm text-slate-900 font-semibold">{{ transaction.customer_name }}</td>
                  <td class="px-6 py-4 text-sm text-right text-slate-900 font-mono font-semibold">
                    {{ transaction.amount | money }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      [class.bg-success-50]="transaction.status === 'paid'"
                      [class.text-success-700]="transaction.status === 'paid'"
                      [class.border]="transaction.status === 'paid'"
                      [class.border-success-200]="transaction.status === 'paid'"
                      [class.bg-warning-50]="transaction.status === 'pending'"
                      [class.text-warning-700]="transaction.status === 'pending'"
                      [class.border-warning-200]="transaction.status === 'pending'"
                    >
                      {{ transaction.status === 'paid' ? ('status.paid' | i18n) : ('status.pending' | i18n) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a
                      [routerLink]="['/ledger']"
                      class="text-slate-400 hover:text-accent-600 transition-colors inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100"
                      title="View in ledger"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </td>
                </tr>
              }
              @if (!(transactions$ | async)?.length) {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                    <svg class="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p class="text-sm font-medium text-slate-500">{{ 'dashboard.no_transactions' | i18n }}</p>
                    <p class="text-xs text-slate-400 mt-1">Recorded weekly collections will appear here in real time.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  stats$ = this.dashboardService.getStats();
  transactions$ = this.dashboardService.getRecentTransactions();

  dashboardIcons = {
    customers: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
    collection: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
    weekly: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
    monthly: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    outstanding: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
    pending: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
  };
}