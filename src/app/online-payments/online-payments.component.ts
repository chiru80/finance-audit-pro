import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
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
              >Customer ID</label
            >
            <input glassInput [(ngModel)]="form.customer_id" placeholder="customer uuid" />
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
            <input glassInput [(ngModel)]="form.transaction_id" />
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block"
              >Amount (INR)</label
            >
            <input glassInput type="number" [(ngModel)]="form.amount_rupees" />
          </div>
        </div>
        <glass-button variant="filled" size="md" class="mt-4" (onClick)="create()"
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
                    <td class="py-2 px-3">{{ p.gateway }}</td>
                    <td class="py-2 px-3 font-mono text-xs">{{ p.transaction_id }}</td>
                    <td class="py-2 px-3">₹{{ (p.amount / 100).toFixed(2) }}</td>
                    <td class="py-2 px-3">{{ p.status }}</td>
                    <td class="py-2 px-3">
                      @if (p.status === 'pending') {
                        <button
                          class="text-xs px-2 py-1 rounded bg-green-600 text-white mr-1"
                          (click)="reconcile(p.id, 'completed')"
                        >
                          Mark paid
                        </button>
                        <button
                          class="text-xs px-2 py-1 rounded bg-red-600 text-white"
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
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  payments = signal<OnlinePayment[]>([]);
  form = { customer_id: '', gateway: 'razorpay', transaction_id: '', amount_rupees: 0 };

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const { data, error } = await this._supabase.client
      .from('online_payments')
      .select('*, customers(name)')
      .order('created_at', { ascending: false });
    if (error) this.error.set(error.message);
    else
      this.payments.set((data || []).map((r: any) => ({ ...r, customer_name: r.customers?.name })));
    this.loading.set(false);
  }

  async create() {
    this.error.set(null);
    this.success.set(null);
    if (!this.form.customer_id || !this.form.transaction_id || !this.form.amount_rupees) {
      this.error.set('All fields are required');
      return;
    }
    const { error } = await this._supabase.client.from('online_payments').insert({
      customer_id: this.form.customer_id,
      gateway: this.form.gateway,
      transaction_id: this.form.transaction_id,
      amount: Math.round(this.form.amount_rupees * 100),
      status: 'pending',
    });
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.success.set('Recorded');
    this.form = { customer_id: '', gateway: 'razorpay', transaction_id: '', amount_rupees: 0 };
    await this.load();
  }

  async reconcile(id: string, status: string) {
    const { data, error } = await this._supabase.client.rpc('update_online_payment_status', {
      p_payment_id: id,
      p_new_status: status,
    });
    if (error) {
      this.error.set(error.message);
      return;
    }
    const res = Array.isArray(data) ? data[0] : data;
    if (res && res.success === false) {
      this.error.set(res.error_message);
      return;
    }
    await this.load();
  }
}
