import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, startWith, switchMap } from 'rxjs';
import type { DashboardStats, LoadState, Transaction } from './dashboard.service';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { MoneyPipe } from '../shared/money-pipe';
import { I18nPipe } from '../shared/i18n.pipe';
import { GlassGoldStatCardComponent } from '../design-system/components/glass-gold-stat-card.component';

@Component({
  selector: 'app-premium-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MoneyPipe, I18nPipe, GlassGoldStatCardComponent],
  template: `
    <div class="w-full max-w-[1440px] mx-auto space-y-8">
      <!-- Hero Panel -->
      <section class="fx-hero-panel">
        <div class="fx-hero-content">
          <h1 class="fx-hero-title">{{ greeting() }}, {{ userName() }}</h1>
          <p class="fx-hero-subtitle">
            A clear view of collections, dues, and recent activity across your portfolio.
            <span class="fx-hero-muted">Last updated {{ todayFormatted }}</span>
          </p>
        </div>
      </section>

      <!-- Quick Actions -->
      <div class="fx-action-bar">
        <a [routerLink]="['/customers']" class="fx-btn fx-btn--gold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          {{ 'dashboard.add_customer' | i18n }}
        </a>
        <a [routerLink]="['/collections']" class="fx-btn fx-btn--gold-outline">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {{ 'dashboard.add_collection' | i18n }}
        </a>
      </div>

      @if (statsLoading()) {
        <section class="fx-card fx-loading-card" role="status" aria-live="polite">
          <div class="fx-loading-header">
            <div class="fx-gold-coin-placeholder"></div>
            <div class="fx-skeleton-text fx-skeleton-text--short"></div>
          </div>
          <div class="fx-grid-3cols">
            @for (placeholder of statPlaceholders; track placeholder) {
              <div class="fx-stat-skeleton"></div>
            }
          </div>
        </section>
      } @else if (statsError()) {
        <section class="fx-card fx-error-card" role="alert">
          <div class="fx-error-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div class="fx-error-content">
            <h2 class="fx-error-title">Dashboard figures unavailable</h2>
            <p class="fx-error-message">{{ statsError() }}</p>
          </div>
          <button type="button" class="fx-btn fx-btn--gold-outlined" (click)="retryStats()">
            Retry
          </button>
        </section>
      } @else {
        <!-- Key Figures - Gold Themed Stat Cards -->
        <div class="fx-stats-grid">
          <fx-gold-stat-card
            [label]="'dashboard.total_customers' | i18n"
            [value]="stats()?.totalCustomers ?? 0"
            [icon]="statIcons.customers"
          />
          <fx-gold-stat-card
            [label]="'dashboard.collected_today' | i18n"
            [value]="rupees(stats()?.todaysCollection)"
            [prefix]="'₹'"
            [icon]="statIcons.todays"
          />
          <fx-gold-stat-card
            [label]="'dashboard.collected_this_week' | i18n"
            [value]="rupees(stats()?.weeklyCollection)"
            [prefix]="'₹'"
            [icon]="statIcons.weekly"
          />
          <fx-gold-stat-card
            [label]="'dashboard.collected_this_month' | i18n"
            [value]="rupees(stats()?.monthlyCollection)"
            [prefix]="'₹'"
            [icon]="statIcons.monthly"
          />
          <fx-gold-stat-card
            [label]="'dashboard.total_outstanding' | i18n"
            [value]="rupees(stats()?.totalOutstanding)"
            [prefix]="'₹'"
            [icon]="statIcons.outstanding"
            [color]="'warning'"
          />
          <fx-gold-stat-card
            [label]="'dashboard.pending_payments' | i18n"
            [value]="rupees(stats()?.pendingPayments)"
            [prefix]="'₹'"
            [icon]="statIcons.pending"
            [color]="'warning'"
          />
        </div>

        <!-- Real-data insights -->
        <div class="fx-grid-2cols">
          <section class="fx-card">
            <div class="fx-card-header">
              <div>
                <h2 class="fx-card-title">Collection activity</h2>
                <p class="fx-card-description">Recorded collections over three trailing periods.</p>
              </div>
              <span class="fx-chip fx-chip--live">Live ledger</span>
            </div>

            <div class="fx-collection-periods">
              @for (period of collectionPeriods(); track period.label) {
                <div class="fx-period-item">
                  <div class="fx-period-header">
                    <span class="fx-period-label">{{ period.label }}</span>
                    <span class="fx-period-amount">{{ period.amount | money }}</span>
                  </div>
                  <div class="fx-period-bar">
                    <div class="fx-period-fill" [style.width.%]="period.share"></div>
                  </div>
                  <p class="fx-period-note">{{ period.note }}</p>
                </div>
              }
            </div>
          </section>

          <section class="fx-card">
            <div class="fx-card-header fx-card-header--warning">
              <div>
                <h2 class="fx-card-title">Outstanding exposure</h2>
                <p class="fx-card-description">Amounts still to be received or confirmed.</p>
              </div>
              <div class="fx-icon-circle fx-icon-circle--warning">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <div class="fx-grid-2cols">
              <div class="fx-expansion-box fx-expansion-box--warning">
                <span class="fx-label fx-label--warning">Customer dues</span>
                <p class="fx-expansion-value">{{ stats()?.totalOutstanding ?? 0 | money }}</p>
                <p class="fx-expansion-note">Across all customers</p>
              </div>
              <div class="fx-expansion-box fx-expansion-box--info">
                <span class="fx-label fx-label--info">Pending entries</span>
                <p class="fx-expansion-value">{{ stats()?.pendingPayments ?? 0 | money }}</p>
                <p class="fx-expansion-note">Awaiting confirmation</p>
              </div>
            </div>

            <div class="fx-card-actions">
              <a [routerLink]="['/ledger']" class="fx-btn fx-btn--gold-text">
                Review ledger
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
              <a [routerLink]="['/reports']" class="fx-btn fx-btn--text-only">View reports</a>
            </div>
          </section>
        </div>

        <!-- Recent transactions -->
        <section class="fx-card fx-table-card">
          <div class="fx-card-header fx-card-header--table">
            <div class="fx-table-header">
              <div class="fx-table-icon">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h2 class="fx-card-title">{{ 'dashboard.recent_transactions' | i18n }}</h2>
                <p class="fx-card-description">Latest entries recorded in the ledger.</p>
              </div>
            </div>
            <a [routerLink]="['/ledger']" class="fx-link">
              View full ledger
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          <div class="fx-table-wrapper">
            <table class="fx-table">
              <caption class="sr-only">
                Recent ledger transactions with date, customer, amount and status
              </caption>
              <thead>
                <tr>
                  <th scope="col">{{ 'dashboard.date' | i18n }}</th>
                  <th scope="col">{{ 'dashboard.customer' | i18n }}</th>
                  <th scope="col" class="text-right">{{ 'dashboard.amount' | i18n }}</th>
                  <th scope="col" class="text-center">{{ 'dashboard.status_label' | i18n }}</th>
                  <th scope="col" class="w-14"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @if (transactionsLoading()) {
                  <tr>
                    <td colspan="5">
                      <div class="fx-empty">
                        <div class="fx-gold-coin-placeholder"></div>
                        <p>Loading recent transactions…</p>
                      </div>
                    </td>
                  </tr>
                } @else if (transactionsError()) {
                  <tr>
                    <td colspan="5">
                      <div class="fx-empty">
                        <h3>Could not load transactions</h3>
                        <p>{{ transactionsError() }}</p>
                        <button
                          type="button"
                          class="fx-btn fx-btn--gold-outlined"
                          (click)="retryTransactions()"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (transaction of transactions(); track transaction.id) {
                    <tr>
                      <td class="fx-table-cell fx-table-cell--secondary">{{ transaction.date }}</td>
                      <td class="fx-table-cell fx-table-cell--primary">
                        {{ transaction.customer_name }}
                      </td>
                      <td class="fx-table-cell fx-table-cell--amount">
                        <span
                          [class.fx-balance-pos]="transaction.amount >= 0"
                          [class.fx-balance-neg]="transaction.amount < 0"
                        >
                          {{ transaction.amount | money }}
                        </span>
                      </td>
                      <td class="fx-table-cell fx-table-cell--center">
                        <span
                          class="fx-badge"
                          [class]="
                            transaction.status === 'paid'
                              ? 'fx-badge--success'
                              : 'fx-badge--warning'
                          "
                        >
                          {{
                            transaction.status === 'paid'
                              ? ('status.paid' | i18n)
                              : ('status.pending' | i18n)
                          }}
                        </span>
                      </td>
                      <td class="fx-table-cell fx-table-cell--actions">
                        <a
                          [routerLink]="['/ledger']"
                          class="fx-action-link"
                          title="View in ledger"
                          aria-label="View in ledger"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.8"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  }
                  @if (!transactions().length) {
                    <tr>
                      <td colspan="5" class="fx-empty-cell">
                        <div class="fx-empty">
                          <div class="fx-table-icon">
                            <svg
                              class="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.6"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <h3>No transactions yet</h3>
                          <p>
                            Collections and payments will appear here as soon as they are recorded.
                          </p>
                          <a [routerLink]="['/collections']" class="fx-btn fx-btn--gold">
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.8"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Record a collection
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styleUrls: ['./premium-dashboard.component.css'],
  animations: [],
})
export class PremiumDashboardComponent {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  private readonly statsReload = new Subject<void>();
  private readonly transactionsReload = new Subject<void>();

  readonly statsState = toSignal(
    this.statsReload.pipe(
      startWith(undefined),
      switchMap(() => this.dashboardService.getStats()),
    ),
    { initialValue: { status: 'loading' } as LoadState<DashboardStats> },
  );
  readonly transactionsState = toSignal(
    this.transactionsReload.pipe(
      startWith(undefined),
      switchMap(() => this.dashboardService.getRecentTransactions()),
    ),
    { initialValue: { status: 'loading' } as LoadState<Transaction[]> },
  );

  readonly stats = computed(() => {
    const state = this.statsState();
    return state.status === 'success' ? state.data : null;
  });
  readonly statsLoading = computed(() => this.statsState().status === 'loading');
  readonly statsError = computed(() => {
    const state = this.statsState();
    return state.status === 'error' ? state.message : null;
  });

  readonly transactions = computed(() => {
    const state = this.transactionsState();
    return state.status === 'success' ? state.data : [];
  });
  readonly transactionsLoading = computed(() => this.transactionsState().status === 'loading');
  readonly transactionsError = computed(() => {
    const state = this.transactionsState();
    return state.status === 'error' ? state.message : null;
  });

  readonly statPlaceholders = [0, 1, 2, 3, 4, 5];

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

  statIcons = {
    customers:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    todays:
      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    weekly:
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    monthly:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    outstanding:
      'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  rupees(paise: number | null | undefined): number {
    return (paise ?? 0) / 100;
  }

  retryStats(): void {
    this.statsReload.next();
  }

  retryTransactions(): void {
    this.transactionsReload.next();
  }

  collectionPeriods = computed(() => {
    const stats = this.stats();
    const monthly = stats?.monthlyCollection ?? 0;
    const share = (value: number) =>
      monthly > 0 ? Math.min(100, Math.round((value / monthly) * 100)) : 0;
    return [
      {
        label: 'Today',
        amount: stats?.todaysCollection ?? 0,
        share: share(stats?.todaysCollection ?? 0),
        note: 'Collected in the current day',
      },
      {
        label: 'Last 7 days',
        amount: stats?.weeklyCollection ?? 0,
        share: share(stats?.weeklyCollection ?? 0),
        note: 'Rolling seven-day total',
      },
      {
        label: 'Last 30 days',
        amount: monthly,
        share: monthly > 0 ? 100 : 0,
        note: 'Rolling thirty-day total',
      },
    ];
  });
}
