import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import type { Customer } from '../customers/customer.types';
import { extractErrorMessage } from '../utils/error.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

interface OnlinePayment {
  id: string;
  customer_id: string;
  customer_name?: string;
  gateway: string;
  transaction_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
}

@Component({
  selector: 'app-online-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCardComponent,
    GlassButtonComponent,
    GlassInputDirective,
  ],
  template: `
    <div class="space-y-6">
      <glass-card variant="elevated" customClass="p-5">
        <h2 class="text-lg font-bold text-[var(--text-primary)] mb-4">Record Online Payment</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block"
              >Customer</label
            >
            <select glassInput [(ngModel)]="form.customer_id">
              <option value="">Select customer...</option>
              @for (c of customers(); track c.id) {
                <option [value]="c.id">{{ c.name }}@if (c.phone) { ({{ c.phone }}) }</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block"
              >Gateway</label
            >
            <select glassInput [(ngModel)]="form.gateway">
              <option value="razorpay">Razorpay</option>
              <option value="paytm">Paytm</option>
              <option value="cashfree">Cashfree</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block"
              >Transaction ID</label
            >
            <input glassInput [(ngModel)]="form.transaction_id" placeholder="e.g. pay_N8x..." />
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block"
              >Amount (INR)</label
            >
            <input glassInput type="number" min="1" [(ngModel)]="form.amount_rupees" />
          </div>
        </div>
        <glass-button
          variant="filled"
          size="md"
          class="mt-4"
          [loading]="submitting()"
          [disabled]="submitting()"
          (onClick)="create()"
          >Record</glass-button
        >
        @if (error()) {
          <p class="text-sm text-[var(--color-danger-text)] mt-2">{{ error() }}</p>
        }
        @if (success()) {
          <p class="text-sm text-[var(--color-success-text)] mt-2">{{ success() }}</p>
        }
      </glass-card>

      <glass-card variant="elevated" customClass="p-5">
        <h2 class="text-lg font-bold text-[var(--text-primary)] mb-4">Online Payments</h2>
        @if (loading()) {
          <p>Loading...</p>
        } @else if (payments().length === 0) {
          <p class="text-[var(--text-muted)]">No online payments recorded.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left text-xs uppercase text-[var(--text-secondary)]">
                  <th class="py-2 px-3">Customer</th>
                  <th class="py-2 px-3">Gateway</th>
                  <th class="py-2 px-3">Transaction</th>
                  <th class="py-2 px-3">Amount</th>
                  <th class="py-2 px-3">Status</th>
                  <th class="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of payments(); track p.id) {
                  <tr class="border-t border-[var(--glass-border-subtle)]">
                    <td class="py-2 px-3 font-medium">{{ p.customer_name || p.customer_id }}</td>
                    <td class="py-2 px-3 capitalize">{{ p.gateway }}</td>
                    <td class="py-2 px-3 font-mono text-xs">{{ p.transaction_id }}</td>
                    <td class="py-2 px-3 font-mono">₹{{ (p.amount / 100).toFixed(2) }}</td>
                    <td class="py-2 px-3 capitalize">{{ p.status }}</td>
                    <td class="py-2 px-3">
                      @if (p.status === 'pending') {
                        <button
                          type="button"
                          [disabled]="updatingId() === p.id"
                          class="text-xs px-2.5 py-1 rounded bg-[var(--color-success-tint)] text-[var(--color-success-text)] border border-[var(--color-success-border)] font-semibold mr-1.5 disabled:opacity-50 cursor-pointer"
                          (click)="reconcile(p.id, 'completed')"
                        >
                          Mark paid
                        </button>
                        <button
                          type="button"
                          [disabled]="updatingId() === p.id"
                          class="text-xs px-2.5 py-1 rounded bg-[var(--color-danger-tint)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] font-semibold disabled:opacity-50 cursor-pointer"
                          (click)="reconcile(p.id, 'failed')"
                        >
                          Mark failed
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </glass-card>
    </div>
  `,
})
export class OnlinePaymentsComponent implements OnInit {
  private readonly _supabase = inject(SupabaseService);
  loading = signal(true);
  submitting = signal(false);
  updatingId = signal<string | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  payments = signal<OnlinePayment[]>([]);
  form = { customer_id: '', gateway: 'razorpay', transaction_id: '', amount_rupees: 0 };

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const [payRes, custRes] = await Promise.all([
      this._supabase.client
        .from('online_payments')
        .select('*, customers(name)')
        .order('created_at', { ascending: false }),
      this._supabase.client
        .from('customers')
        .select('id, name, phone, status')
        .eq('status', 'active')
        .order('name', { ascending: true }),
    ]);

    if (payRes.error) this.error.set(extractErrorMessage(payRes.error, 'Failed to load payments'));
    else
      this.payments.set(
        (payRes.data || []).map((r: any) => ({ ...r, customer_name: r.customers?.name })),
      );

    if (!custRes.error && custRes.data) {
      this.customers.set(custRes.data as Customer[]);
    }
    this.loading.set(false);
  }

  async create() {
    this.error.set(null);
    this.success.set(null);
    if (!this.form.customer_id || !this.form.transaction_id.trim() || Number(this.form.amount_rupees) <= 0) {
      this.error.set('Customer, transaction ID, and a positive amount are required');
      return;
    }

    this.submitting.set(true);
    try {
      const { error } = await this._supabase.client.from('online_payments').insert({
        customer_id: this.form.customer_id,
        gateway: this.form.gateway,
        transaction_id: this.form.transaction_id.trim(),
        amount: Math.round(Number(this.form.amount_rupees) * 100),
        status: 'pending',
      });
      if (error) {
        this.error.set(extractErrorMessage(error, 'Failed to record online payment'));
        return;
      }
      this.success.set('Recorded online payment');
      this.form = { customer_id: '', gateway: 'razorpay', transaction_id: '', amount_rupees: 0 };
      await this.load();
    } finally {
      this.submitting.set(false);
    }
  }

  async reconcile(id: string, status: string) {
    this.error.set(null);
    this.updatingId.set(id);
    try {
      const { data, error } = await this._supabase.client.rpc('update_online_payment_status', {
        p_payment_id: id,
        p_new_status: status,
      });

      const res = Array.isArray(data) ? data[0] : data;
      const needsFallback =
        error?.code === '42804' ||
        error?.code === 'PGRST202' ||
        error?.message?.includes('does not match function result type') ||
        res?.error_message === 'Online payment record not found';

      if (needsFallback) {
        const { error: directErr } = await this._supabase.client
          .from('online_payments')
          .update({
            status,
            paid_at: status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', id);
        if (directErr) {
          this.error.set(extractErrorMessage(directErr, 'Failed to update status'));
          return;
        }
        await this.load();
        return;
      }

      if (error) {
        this.error.set(extractErrorMessage(error, 'Failed to update status'));
        return;
      }
      if (res && res.success === false) {
        this.error.set(res.error_message || 'Failed to update status');
        return;
      }
      await this.load();
    } finally {
      this.updatingId.set(null);
    }
  }
}
