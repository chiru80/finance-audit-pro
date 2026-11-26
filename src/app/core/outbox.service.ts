import { Injectable, inject, signal } from '@angular/core';
import { CollectionService } from '../collection.service';
import { extractErrorMessage } from '../utils/error.utils';
import { IndexedDbService } from './indexed-db.service';
import { OfflineStatusService } from './offline-status.service';

export interface PendingPayment {
  id?: number;
  customerId: string;
  customerName?: string;
  amountPaise: number;
  method: 'cash' | 'online' | 'cheque' | 'other';
  reference: string | null;
  notes: string | null;
  createdAt: number;
  attempts: number;
  lastError: string | null;
  status: 'pending' | 'syncing' | 'failed';
}

@Injectable({ providedIn: 'root' })
export class OutboxService {
  private readonly db = inject(IndexedDbService);
  private readonly collectionService = inject(CollectionService);
  private readonly status = inject(OfflineStatusService);

  readonly pending = signal<PendingPayment[]>([]);
  readonly syncing = signal(false);

  constructor() {
    this.refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncAll());
    }
  }

  async refresh(): Promise<void> {
    const rows = await this.db.getAll<PendingPayment>('outbox');
    this.pending.set(rows.sort((a, b) => a.createdAt - b.createdAt));
  }

  async enqueue(
    item: Omit<PendingPayment, 'id' | 'createdAt' | 'attempts' | 'lastError' | 'status'>,
  ): Promise<void> {
    const row: PendingPayment = {
      ...item,
      createdAt: Date.now(),
      attempts: 0,
      lastError: null,
      status: 'pending',
    };
    await this.db.put('outbox', row);
    await this.refresh();
  }

  async remove(id: number): Promise<void> {
    await this.db.delete('outbox', id);
    await this.refresh();
  }

  async syncAll(): Promise<{ synced: number; failed: number }> {
    if (this.syncing()) return { synced: 0, failed: 0 };
    if (!this.status.isOnline()) return { synced: 0, failed: 0 };
    this.syncing.set(true);
    let synced = 0;
    let failed = 0;
    try {
      const rows = [...this.pending()];
      for (const row of rows) {
        if (!row.id) continue;
        await this.db.put('outbox', { ...row, status: 'syncing' });
        await this.refresh();
        try {
          const res = await this.collectionService.recordWeeklyPayment(
            row.customerId,
            row.amountPaise,
            row.method,
            row.reference || '',
            row.notes || '',
          );
          if (!res.success) {
            throw new Error(res.error || 'Payment recording failed');
          }
          await this.db.delete('outbox', row.id);
          synced++;
        } catch (err) {
          const msg = extractErrorMessage(err, 'Sync failed');
          await this.db.put('outbox', {
            ...row,
            attempts: row.attempts + 1,
            lastError: msg,
            status: 'failed',
          });
          failed++;
        }
        await this.refresh();
      }
    } finally {
      this.syncing.set(false);
      await this.refresh();
    }
    return { synced, failed };
  }

  get count(): number {
    return this.pending().length;
  }
}
