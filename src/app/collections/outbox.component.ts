import { Component, inject, signal } from '@angular/core';
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
    <div class="space-y-4">
      <glass-card>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Offline Outbox</h2>
            <p class="text-sm text-[var(--text-secondary)]">
              {{ outbox.pending().length }} pending payment(s) waiting to sync.
            </p>
          </div>
          <glass-button
            variant="filled"
            [disabled]="outbox.syncing() || !status.isOnline()"
            (click)="sync()"
          >
            {{ outbox.syncing() ? 'Syncing…' : 'Sync now' }}
          </glass-button>
        </div>
        @if (!status.isOnline()) {
          <p class="mt-2 text-xs text-amber-500">You are offline. Sync will run automatically when connected.</p>
        }
      </glass-card>

      @if (outbox.pending().length === 0) {
        <glass-card>
          <p class="text-sm text-[var(--text-secondary)]">No pending payments. All caught up.</p>
        </glass-card>
      } @else {
        <glass-card>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[var(--text-secondary)]">
                  <th class="py-2">Customer</th>
                  <th class="py-2">Amount</th>
                  <th class="py-2">Method</th>
                  <th class="py-2">Queued</th>
                  <th class="py-2">Status</th>
                  <th class="py-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (p of outbox.pending(); track p.id) {
                  <tr class="border-t border-[var(--border-subtle)]">
                    <td class="py-2">{{ p.customerName || p.customerId }}</td>
                    <td class="py-2">{{ format(p.amountPaise) }}</td>
                    <td class="py-2">{{ p.method }}</td>
                    <td class="py-2">{{ p.createdAt | date:'short' }}</td>
                    <td class="py-2">
                      @if (p.status === 'failed') {
                        <span class="text-red-500">{{ p.lastError }}</span>
                      } @else {
                        <span class="text-[var(--text-secondary)]">{{ p.status }}</span>
                      }
                    </td>
                    <td class="py-2">
                      @if (p.id) {
                        <button class="text-xs text-red-500" (click)="remove(p.id!)">Remove</button>
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
