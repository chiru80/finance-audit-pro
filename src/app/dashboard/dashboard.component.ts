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
    <div class="dashboard">
      <h1 class="text-2xl font-bold text-text-primary mb-6">{{ 'dashboard.title' | i18n }}</h1>

      <!-- Stats Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
      <div class="bg-background-primary border border-border-light rounded-lg overflow-hidden mb-6">
        <div class="px-4 py-3 border-b border-border-light bg-background-secondary">
          <h2 class="text-lg font-semibold text-text-primary">{{ 'dashboard.recent_transactions' | i18n }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-background-secondary">
              <tr class="border-b border-border-light">
                <th class="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">{{ 'dashboard.date' | i18n }}</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">{{ 'dashboard.customer' | i18n }}</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase tracking-wide">{{ 'dashboard.amount' | i18n }}</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase tracking-wide">{{ 'dashboard.status_label' | i18n }}</th>
                <th class="px-4 py-2 text-right w-12"></th>
              </tr>
            </thead>
            <tbody>
              @for (transaction of transactions$ | async; track transaction.id) {
                <tr class="border-b border-border-light last:border-b-0 hover:bg-background-secondary transition-colors">
                  <td class="px-4 py-2 text-sm text-text-primary">{{ transaction.date }}</td>
                  <td class="px-4 py-2 text-sm text-text-primary">{{ transaction.customer_name }}</td>
                  <td class="px-4 py-2 text-sm text-right text-text-primary font-mono">
                    {{ transaction.amount | money }}
                  </td>
                  <td class="px-4 py-2 text-sm text-right">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-success-100]="transaction.status === 'paid'"
                      [class.text-success-800]="transaction.status === 'paid'"
                      [class.bg-warning-100]="transaction.status === 'pending'"
                      [class.text-warning-800]="transaction.status === 'pending'"
                    >
                      {{ transaction.status === 'paid' ? ('status.paid' | i18n) : ('status.pending' | i18n) }}
                    </span>
                  </td>
                  <td class="px-4 py-2">
                    <a
                      [routerLink]="['/ledger']"
                      class="text-primary-600 hover:text-primary-700"
                      title="View in ledger"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </td>
                </tr>
              }
              @if (!(transactions$ | async)?.length) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-text-muted">
                    {{ 'dashboard.no_transactions' | i18n }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-lg font-semibold text-text-primary mb-3">{{ 'dashboard.quick_actions' | i18n }}</h2>
        <div class="flex flex-wrap gap-3">
          <a
            [routerLink]="['/collections']"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'dashboard.add_collection' | i18n }}
          </a>
          <a
            [routerLink]="['/customers']"
            class="inline-flex items-center gap-2 px-4 py-2 bg-background-primary border border-border-light text-sm font-medium rounded-lg text-text-secondary hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'dashboard.add_customer' | i18n }}
          </a>
          <a
            [routerLink]="['/reports']"
            class="inline-flex items-center gap-2 px-4 py-2 bg-background-primary border border-border-light text-sm font-medium rounded-lg text-text-secondary hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 3v4M8 3v4M3 11h18" />
            </svg>
            {{ 'dashboard.view_reports' | i18n }}
          </a>
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
    customers: '<path d="M17 20v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m8 0h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6m8 0V10a2 2 0 00-2-2H9a2 2 0 00-2 2v8h12z" />',
    collection: '<path d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z" />',
    weekly: '<path d="M8 7V3m8 4V3m-10 8h4m-4 4h4m-4 4h4m-4 4h4" />',
    monthly: '<path d="M8 7V3m8 4V3m-10 8h4m-4 4h4m-4 4h4m-4 4h4" />',
    outstanding: '<path d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z" />',
    pending: '<path d="M12 8c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm0 8a4 4 0 100-8 4 4 0 000 8z" />',
  };
}