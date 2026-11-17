import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { MoneyPipe } from '../shared/money-pipe';
import { I18nPipe } from '../shared/i18n.pipe';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassStatCardComponent } from '../design-system/components/glass-stat-card.component';
import { GlassEmptyStateComponent } from '../design-system/components/glass-empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MoneyPipe,
    I18nPipe,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassStatCardComponent,
    GlassEmptyStateComponent,
  ],
  template: `
    <div class="dashboard max-w-7xl mx-auto space-y-8">
      <!-- Header Banner / Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#263449]">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[var(--color-info)] uppercase tracking-widest">Overview</span>
            <span class="text-[#64748B]">•</span>
            <span class="text-xs text-[var(--text-secondary)]">{{ todayFormatted }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
            {{ greeting() }}, {{ userName() }}
          </h1>
          <p class="text-sm font-medium text-[#94A3B8] mt-1">Here's your real-time financial collection & audit overview.</p>
        </div>

        <!-- Header Quick Action buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <a [routerLink]="['/collections']">
            <glass-button variant="filled" size="md">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              {{ 'dashboard.add_collection' | i18n }}
            </glass-button>
          </a>
          <a [routerLink]="['/customers']">
            <glass-button variant="glass" size="md">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {{ 'dashboard.add_customer' | i18n }}
            </glass-button>
          </a>
          <a [routerLink]="['/reports']">
            <glass-button variant="glass" size="md">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {{ 'dashboard.view_reports' | i18n }}
            </glass-button>
          </a>
        </div>
      </div>

      <!-- Stats Summary Cards in Responsive Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <glass-stat-card
          label="Total Customers"
          [value]="(stats$ | async)?.totalCustomers ?? 0"
          color="primary"
          [trend]="8.4"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />"
        />
        <glass-stat-card
          label="Today's Collection"
          [value]="(stats$ | async)?.todaysCollection ?? 0"
          prefix="₹"
          color="success"
          [trend]="12.5"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />"
        />
        <glass-stat-card
          label="Weekly Collection"
          [value]="(stats$ | async)?.weeklyCollection ?? 0"
          prefix="₹"
          color="success"
          [trend]="5.2"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />"
        />
        <glass-stat-card
          label="Monthly Collection"
          [value]="(stats$ | async)?.monthlyCollection ?? 0"
          prefix="₹"
          color="success"
          [trend]="18.0"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />"
        />
        <glass-stat-card
          label="Total Outstanding"
          [value]="(stats$ | async)?.totalOutstanding ?? 0"
          prefix="₹"
          color="warning"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />"
        />
        <glass-stat-card
          label="Pending Payments"
          [value]="(stats$ | async)?.pendingPayments ?? 0"
          prefix="₹"
          color="warning"
          icon="<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />"
        />
      </div>

      <!-- Interactive Analytics Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Collection Velocity & Area Chart Card -->
        <glass-card variant="elevated" customClass="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
              <div>
                <h3 class="text-[var(--glass-text-xl)] font-bold text-[var(--text-primary)]">Collection Velocity & Trend</h3>
                <p class="text-[var(--glass-text-xs)] font-medium text-[var(--text-secondary)] mt-0.5">Recorded dues collected vs targets over weekly cycles.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" style="background: var(--color-primary-light); color: var(--color-primary-light); border: 1px solid var(--color-primary-border);">
                  <span class="w-2 h-2 rounded-full" style="background: var(--primary-accent)"></span>
                  Weekly Cycles
                </span>
              </div>
            </div>

            <!-- SVG Visual Trend Chart -->
            <div class="w-full h-44 relative mt-2">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none" role="img" aria-label="Collection velocity trend chart showing weekly cycles progress with data points at weeks 3, 8, and 15 highlighted.">
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary-accent)" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="var(--primary-accent)" stop-opacity="0.00"/>
                  </linearGradient>
                </defs>
                <!-- Subtle grid lines -->
                <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border-color)" stroke-dasharray="4"/>
                <line x1="0" y1="70" x2="500" y2="70" stroke="var(--border-color)" stroke-dasharray="4"/>
                <line x1="0" y1="110" x2="500" y2="110" stroke="var(--border-color)"/>

                <!-- Area fill -->
                <path d="M 0 110 L 0 85 Q 80 50 160 65 T 320 35 T 450 20 L 500 15 L 500 110 Z" fill="url(#velocityGradient)"/>
                <!-- Line curve -->
                <path d="M 0 85 Q 80 50 160 65 T 320 35 T 450 20 L 500 15" fill="none" stroke="var(--primary-hover)" stroke-width="3" stroke-linecap="round"/>

                <!-- Data point pins -->
                <circle cx="160" cy="65" r="4.5" fill="var(--primary-hover)" class="stroke-[var(--bg-primary)] stroke-2 shadow-sm"/>
                <circle cx="320" cy="35" r="4.5" fill="var(--primary-hover)" class="stroke-[var(--bg-primary)] stroke-2 shadow-sm"/>
                <circle cx="500" cy="15" r="5" fill="var(--color-primary-light)" class="stroke-[var(--bg-primary)] stroke-2 shadow-md animate-pulse"/>
              </svg>
            </div>
          </div>

          <!-- Bottom Metric Highlights -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)] mt-4 text-center">
            <div>
              <span class="text-[var(--glass-text-xs)] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">Current Target</span>
              <span class="text-[var(--glass-text-lg)] font-extrabold text-[var(--text-primary)] font-mono mt-0.5 block">₹50,000</span>
            </div>
            <div>
              <span class="text-[var(--glass-text-xs)] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">Weekly Completion</span>
              <span class="text-[var(--glass-text-lg)] font-extrabold text-[var(--color-success)] font-mono mt-0.5 block">84.2%</span>
            </div>
            <div>
              <span class="text-[var(--glass-text-xs)] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">Audit Clearance</span>
              <span class="text-[var(--glass-text-lg)] font-extrabold text-[var(--color-info)] font-mono mt-0.5 block">Verified</span>
            </div>
          </div>
        </glass-card>

        <!-- Payment Allocation & Status Donut Card -->
        <glass-card variant="elevated" customClass="p-6 flex flex-col justify-between">
          <div>
            <div class="border-b border-[var(--border-color)] pb-3 mb-4">
              <h3 class="text-[var(--glass-text-xl)] font-bold text-[var(--text-primary)]">Dues Status Breakdown</h3>
              <p class="text-[var(--glass-text-xs)] font-medium text-[var(--text-secondary)] mt-0.5">Distribution across portfolio obligations.</p>
            </div>

            <!-- Circular Status Graphic -->
            <div class="flex items-center justify-center py-2 relative">
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36" role="img" aria-label="Portfolio health score 92%; dues status: 65% collected, 25% outstanding, 10% pending review">
                <!-- Track -->
                <path stroke="var(--glass-surface-elevated)" stroke-width="3.5" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Paid Segment (65%) -->
                <path stroke="var(--color-success)" stroke-dasharray="65, 100" stroke-width="3.5" stroke-linecap="round" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Outstanding Segment (25%) -->
                <path stroke="var(--color-warning)" stroke-dasharray="25, 100" stroke-dashoffset="-65" stroke-width="3.5" stroke-linecap="round" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Pending Segment (10%) -->
                <path stroke="var(--color-info)" stroke-dasharray="10, 100" stroke-dashoffset="-90" stroke-width="3.5" stroke-linecap="round" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-[var(--glass-text-sm)] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Health Score</span>
                <span class="text-[var(--glass-text-2xl)] font-extrabold text-[var(--text-primary)]">92%</span>
              </div>
            </div>
          </div>

          <!-- Donut Legend -->
          <div class="space-y-2 pt-3 border-t border-[var(--border-color)] text-[var(--glass-text-xs)]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-success)"></span>
                <span class="font-medium text-[var(--text-secondary)]">Collected Dues</span>
              </div>
              <span class="font-bold text-[var(--text-primary)] font-mono">65%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-warning)"></span>
                <span class="font-medium text-[var(--text-secondary)]">Outstanding</span>
              </div>
              <span class="font-bold text-[var(--text-primary)] font-mono">25%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-info)"></span>
                <span class="font-medium text-[var(--text-secondary)]">Pending Review</span>
              </div>
              <span class="font-bold text-[var(--text-primary)] font-mono">10%</span>
            </div>
          </div>
        </glass-card>
      </div>

      <!-- Recent Transactions Card -->
      <glass-card variant="elevated" customClass="overflow-hidden">
        <div class="px-6 py-4.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-input)]">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-[var(--primary-accent)] shadow-xs" style="box-shadow: 0 0 8px var(--primary-accent)"></span>
            <h2 class="text-[var(--glass-text-lg)] font-bold text-[var(--text-primary)] tracking-tight">{{ 'dashboard.recent_transactions' | i18n }}</h2>
          </div>
          <a
            [routerLink]="['/ledger']"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors"
          >
            <span>View Full Ledger</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-[var(--bg-input)] border-b border-[var(--border-color)]">
                <th class="px-6 py-3.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">{{ 'dashboard.date' | i18n }}</th>
                <th class="px-6 py-3.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">{{ 'dashboard.customer' | i18n }}</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">{{ 'dashboard.amount' | i18n }}</th>
                <th class="px-6 py-3.5 text-center text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">{{ 'dashboard.status_label' | i18n }}</th>
                <th class="px-6 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              @for (transaction of transactions$ | async; track transaction.id) {
                <tr class="hover:bg-[var(--glass-surface-elevated)] transition-colors">
                  <td class="px-6 py-4 text-sm text-[var(--text-secondary)] font-medium">{{ transaction.date }}</td>
                  <td class="px-6 py-4 text-sm text-[var(--text-primary)] font-bold">{{ transaction.customer_name }}</td>
                  <td class="px-6 py-4 text-sm text-right text-[var(--color-success)] font-mono font-extrabold">
                    {{ transaction.amount | money }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <glass-badge [status]="transaction.status === 'paid' ? 'paid' : 'pending'">
                      {{ transaction.status === 'paid' ? ('status.paid' | i18n) : ('status.pending' | i18n) }}
                    </glass-badge>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a
                      [routerLink]="['/ledger']"
                      class="text-[var(--text-muted)] hover:text-[var(--color-info)] transition-colors inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] glass-focus-visible"
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
                  <td colspan="5" class="px-6 py-14 text-center">
                    <glass-empty-state
                      title="No transactions yet"
                      description="Recorded weekly collections will appear here in real time."
                      variant="info"
                      size="sm"
                      actionLabel="Record First Collection"
                      actionVariant="filled"
                      (action)="($event)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </glass-card>
    </div>
  `,
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  stats$ = this.dashboardService.getStats();
  transactions$ = this.dashboardService.getRecentTransactions();

  todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  userName = computed(() => {
    const user = this.authService.user();
    return user?.user_metadata?.['full_name'] || user?.email?.split('@')[0] || 'Partner';
  });

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  dashboardIcons = {
    customers: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
    collection: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
    weekly: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
    monthly: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    outstanding: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
    pending: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
  };
}
