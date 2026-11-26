import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { OutboxService } from '../core/outbox.service';
import { OfflineStatusService } from '../core/offline-status.service';
import { formatPaiseToINR } from '../utils/currency.utils';

@Component({
  selector: 'app-outbox',
  standalone: true,
  imports: [CommonModule, GlassCardComponent, GlassButtonComponent],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <glass-card variant="elevated" customClass="p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.1em] bg-[var(--color-primary-tint)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] mb-1.5"
            >
              Sync Queue
            </span>
            <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Offline Outbox
            </h1>
            <p class="text-sm text-[var(--text-secondary)] mt-0.5">
              {{ outbox.pending().length }} pending payment(s) waiting to sync.
            </p>
          </div>
          <glass-button
            variant="filled"
            [disabled]="outbox.syncing() || !status.isOnline() || outbox.pending().length === 0"
            [loading]="outbox.syncing()"
            (onClick)="sync()"
          >
            {{ outbox.syncing() ? 'Syncing…' : 'Sync now' }}
          </glass-button>
        </div>
        @if (!status.isOnline()) {
          <p class="mt-3 text-xs text-[var(--color-warning-text)]">
            You are offline. Sync will run automatically when connected.
          </p>
        }
      </glass-card>

      @if (outbox.pending().length === 0) {
        <glass-card variant="elevated" customClass="p-10 text-center">
          <div
            class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-success-tint)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--text-primary)]">All caught up</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            No pending offline payments waiting to sync.
          </p>
        </glass-card>
      } @else {
        <glass-card variant="elevated" customClass="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-[var(--glass-border-subtle)] text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                >
                  <th class="py-3 px-4">Customer</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                  <th class="py-3 px-4">Method</th>
                  <th class="py-3 px-4">Queued</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (p of outbox.pending(); track p.id) {
                  <tr
                    class="border-b border-[var(--glass-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td class="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                      {{ p.customerName || p.customerId }}
                    </td>
                    <td class="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                      {{ format(p.amountPaise) }}
                    </td>
                    <td class="py-3.5 px-4 capitalize text-[var(--text-secondary)]">
                      {{ p.method }}
                    </td>
                    <td class="py-3.5 px-4 text-[var(--text-secondary)]">
                      {{ p.createdAt | date: 'short' }}
                    </td>
                    <td class="py-3.5 px-4">
                      @if (p.status === 'failed') {
                        <span class="text-[var(--color-danger-text)]">{{ p.lastError }}</span>
                      } @else {
                        <span class="capitalize text-[var(--text-secondary)]">{{ p.status }}</span>
                      }
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      @if (p.id) {
                        <button
                          type="button"
                          class="text-xs font-medium text-[var(--color-danger-text)] hover:underline"
                          (click)="remove(p.id!)"
                        >
                          Remove
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </glass-card>
      }
    </div>
  `,
})
export class OutboxComponent {
  protected readonly outbox = inject(OutboxService);
  protected readonly status = inject(OfflineStatusService);

  async sync() {
    await this.outbox.syncAll();
  }

  async remove(id: number) {
    await this.outbox.remove(id);
  }

  format(paise: number): string {
    return formatPaiseToINR(paise);
  }
}
