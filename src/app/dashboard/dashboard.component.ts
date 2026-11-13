import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { StatCardComponent } from '../shared/stat-card.component';
import { MoneyPipe } from '../shared/money-pipe';
import { I18nPipe } from '../shared/i18n.pipe';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    MoneyPipe,
    I18nPipe,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
  ],
  template: `
    <div class="dashboard max-w-7xl mx-auto space-y-8">
      <!-- Header Banner / Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#263449]">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#38BDF8] uppercase tracking-widest">Overview</span>
            <span class="text-[#64748B]">•</span>
            <span class="text-xs text-[#94A3B8]">{{ todayFormatted }}</span>
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
        <app-stat-card
          [label]="'dashboard.total_customers' | i18n"
          [value]="(stats$ | async)?.totalCustomers ?? 0"
          [color]="'primary'"
          [trend]="8.4"
          [icon]="dashboardIcons.customers"
        />
        <app-stat-card
          [label]="'dashboard.todays_collection' | i18n"
          [value]="(stats$ | async)?.todaysCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [suffix]="' today'"
          [trend]="12.5"
          [icon]="dashboardIcons.collection"
        />
        <app-stat-card
          [label]="'dashboard.weekly_collection' | i18n"
          [value]="(stats$ | async)?.weeklyCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [trend]="5.2"
          [icon]="dashboardIcons.weekly"
        />
        <app-stat-card
          [label]="'dashboard.monthly_collection' | i18n"
          [value]="(stats$ | async)?.monthlyCollection ?? 0"
          [prefix]="'₹'"
          [color]="'success'"
          [trend]="18.0"
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

      <!-- Interactive Analytics Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Collection Velocity & Area Chart Card -->
        <glass-card variant="elevated" customClass="lg:col-span-2 p-6 bg-[#151F32] border border-[#263449] rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-[#263449] pb-4 mb-4">
              <div>
                <h3 class="text-base font-bold text-[#F8FAFC]">Collection Velocity & Trend</h3>
                <p class="text-xs font-medium text-[#94A3B8] mt-0.5">Recorded dues collected vs targets over weekly cycles.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-[#38BDF8] border border-blue-500/30">
                  <span class="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  Weekly Cycles
                </span>
              </div>
            </div>

            <!-- SVG Visual Trend Chart -->
            <div class="w-full h-44 relative mt-2">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0.00"/>
                  </linearGradient>
                </defs>
                <!-- Subtle grid lines -->
                <line x1="0" y1="30" x2="500" y2="30" stroke="#263449" stroke-dasharray="4"/>
                <line x1="0" y1="70" x2="500" y2="70" stroke="#263449" stroke-dasharray="4"/>
                <line x1="0" y1="110" x2="500" y2="110" stroke="#263449"/>

                <!-- Area fill -->
                <path d="M 0 110 L 0 85 Q 80 50 160 65 T 320 35 T 450 20 L 500 15 L 500 110 Z" fill="url(#velocityGradient)"/>
                <!-- Line curve -->
                <path d="M 0 85 Q 80 50 160 65 T 320 35 T 450 20 L 500 15" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>

                <!-- Data point pins -->
                <circle cx="160" cy="65" r="4.5" fill="#3B82F6" class="stroke-[#0B1120] stroke-2 shadow-sm"/>
                <circle cx="320" cy="35" r="4.5" fill="#3B82F6" class="stroke-[#0B1120] stroke-2 shadow-sm"/>
                <circle cx="500" cy="15" r="5" fill="#60A5FA" class="stroke-[#0B1120] stroke-2 shadow-md animate-pulse"/>
              </svg>
            </div>
          </div>

          <!-- Bottom Metric Highlights -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-[#263449] mt-4 text-center">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Current Target</span>
              <span class="text-base font-extrabold text-[#F8FAFC] font-mono mt-0.5 block">₹50,000</span>
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Weekly Completion</span>
              <span class="text-base font-extrabold text-[#34D399] font-mono mt-0.5 block">84.2%</span>
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Audit Clearance</span>
              <span class="text-base font-extrabold text-[#38BDF8] font-mono mt-0.5 block">Verified</span>
            </div>
          </div>
        </glass-card>

        <!-- Payment Allocation & Status Donut Card -->
        <glass-card variant="elevated" customClass="p-6 bg-[#151F32] border border-[#263449] rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div class="border-b border-[#263449] pb-3 mb-4">
              <h3 class="text-base font-bold text-[#F8FAFC]">Dues Status Breakdown</h3>
              <p class="text-xs font-medium text-[#94A3B8] mt-0.5">Distribution across portfolio obligations.</p>
            </div>

            <!-- Circular Status Graphic -->
            <div class="flex items-center justify-center py-2 relative">
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <!-- Track -->
                <path stroke="#18243A" stroke-width="3.5" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Paid Segment (65%) -->
                <path class="text-emerald-500" stroke-dasharray="65, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Outstanding Segment (25%) -->
                <path class="text-amber-500" stroke-dasharray="25, 100" stroke-dashoffset="-65" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Pending Segment (10%) -->
                <path class="text-blue-500" stroke-dasharray="10, 100" stroke-dashoffset="-90" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xs font-bold text-[#64748B] uppercase">Health</span>
                <span class="text-xl font-extrabold text-[#F8FAFC]">92%</span>
              </div>
            </div>
          </div>

          <!-- Donut Legend -->
          <div class="space-y-2 pt-3 border-t border-[#263449] text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span class="font-medium text-[#94A3B8]">Collected Dues</span>
              </div>
              <span class="font-bold text-[#F8FAFC] font-mono">65%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span class="font-medium text-[#94A3B8]">Outstanding</span>
              </div>
              <span class="font-bold text-[#F8FAFC] font-mono">25%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span class="font-medium text-[#94A3B8]">Pending Review</span>
              </div>
              <span class="font-bold text-[#F8FAFC] font-mono">10%</span>
            </div>
          </div>
        </glass-card>
      </div>

      <!-- Recent Transactions Card -->
      <glass-card variant="elevated" customClass="bg-[#151F32] border border-[#263449] rounded-2xl shadow-xl overflow-hidden">
        <div class="px-6 py-4.5 border-b border-[#263449] flex items-center justify-between bg-[#111827]">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-xs shadow-blue-500/50"></span>
            <h2 class="text-base font-bold text-[#F8FAFC] tracking-tight">{{ 'dashboard.recent_transactions' | i18n }}</h2>
          </div>
          <a
            [routerLink]="['/ledger']"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] hover:text-[#60A5FA] transition-colors"
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
              <tr class="bg-[#0F172A] border-b border-[#263449]">
                <th class="px-6 py-3.5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{{ 'dashboard.date' | i18n }}</th>
                <th class="px-6 py-3.5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{{ 'dashboard.customer' | i18n }}</th>
                <th class="px-6 py-3.5 text-right text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{{ 'dashboard.amount' | i18n }}</th>
                <th class="px-6 py-3.5 text-center text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{{ 'dashboard.status_label' | i18n }}</th>
                <th class="px-6 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#263449]">
              @for (transaction of transactions$ | async; track transaction.id) {
                <tr class="hover:bg-[#18243A]/70 transition-colors">
                  <td class="px-6 py-4 text-sm text-[#94A3B8] font-medium">{{ transaction.date }}</td>
                  <td class="px-6 py-4 text-sm text-[#F8FAFC] font-bold">{{ transaction.customer_name }}</td>
                  <td class="px-6 py-4 text-sm text-right text-[#34D399] font-mono font-extrabold">
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
                      class="text-[#64748B] hover:text-[#38BDF8] transition-colors inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-[#18243A]"
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
                    <div class="w-12 h-12 mx-auto rounded-2xl bg-blue-500/15 text-[#38BDF8] border border-blue-500/30 flex items-center justify-center mb-3 shadow-xs">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p class="text-sm font-bold text-[#F8FAFC]">{{ 'dashboard.no_transactions' | i18n }}</p>
                    <p class="text-xs font-semibold text-[#94A3B8] mt-1">Recorded weekly collections will appear here in real time.</p>
                    <div class="mt-4">
                      <a [routerLink]="['/collections']">
                        <glass-button variant="filled" size="sm">
                          Record First Collection
                        </glass-button>
                      </a>
                    </div>
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
