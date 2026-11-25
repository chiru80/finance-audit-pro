import type { OnInit } from '@angular/core';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import type { Village, Customer } from '../customers/customer.types';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassBadgeComponent } from '../design-system/components/glass-badge.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { formatPaiseToINR } from '../utils/currency.utils';

interface VillageSummary extends Village {
  customerCount: number;
  activeCount: number;
  totalOutstanding: number;
}

@Component({
  selector: 'app-villages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    GlassCardComponent,
    GlassButtonComponent,
    GlassBadgeComponent,
    GlassInputDirective,
  ],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Page Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[var(--glass-border-subtle)]"
      >
        <div>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.1em] bg-[var(--color-primary-tint)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] mb-1.5"
          >
            Territory
          </span>
          <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Villages</h1>
          <p class="text-sm text-[var(--text-secondary)] mt-0.5">
            Organize borrowers by village and jump straight to village-wise collections.
          </p>
        </div>

        <form (ngSubmit)="addVillage()" class="flex items-center gap-2 w-full sm:w-auto">
          <input
            glassInput
            type="text"
            name="newVillageName"
            [(ngModel)]="newVillageName"
            placeholder="New village name..."
            class="sm:w-56"
            [disabled]="saving()"
          />
          <glass-button
            type="submit"
            variant="filled"
            size="md"
            [disabled]="saving() || !newVillageName.trim()"
            [loading]="saving()"
          >
            Add Village
          </glass-button>
        </form>
      </div>

      @if (error()) {
        <div
          role="alert"
          class="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-tint)] px-4 py-3 text-sm text-[var(--color-danger-text)]"
        >
          {{ error() }}
        </div>
      }

      @if (success()) {
        <div
          role="status"
          class="rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-tint)] px-4 py-3 text-sm text-[var(--color-success-text)]"
        >
          {{ success() }}
        </div>
      }

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <glass-card variant="elevated" customClass="p-4">
          <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Active Villages
          </p>
          <p class="mt-1 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
            {{ activeVillageCount() }}
          </p>
        </glass-card>
        <glass-card variant="elevated" customClass="p-4">
          <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Assigned Borrowers
          </p>
          <p class="mt-1 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
            {{ assignedCustomersCount() }}
          </p>
        </glass-card>
        <glass-card variant="elevated" customClass="p-4">
          <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Total Village Outstanding
          </p>
          <p class="mt-1 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
            {{ formatCurrency(totalVillageOutstanding()) }}
          </p>
        </glass-card>
      </div>

      <!-- Villages List -->
      <glass-card variant="elevated" customClass="overflow-hidden">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <div
              class="h-9 w-9 animate-spin rounded-full border-4 border-[var(--glass-border-subtle)] border-t-[var(--primary-accent)]"
            ></div>
          </div>
        } @else if (villageSummaries().length === 0) {
          <div class="p-10 text-center">
            <p class="text-base font-medium text-[var(--text-primary)]">No villages added yet</p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Add your first village above to group customers and filter collections.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr
                  class="border-b border-[var(--glass-border-subtle)] text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]"
                >
                  <th class="py-3 px-4">Village</th>
                  <th class="py-3 px-4">Borrowers</th>
                  <th class="py-3 px-4 text-right">Outstanding</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (v of villageSummaries(); track v.id) {
                  <tr
                    class="border-b border-[var(--glass-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td class="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                      {{ v.name }}
                    </td>
                    <td class="py-3.5 px-4 text-[var(--text-secondary)] tabular-nums">
                      {{ v.activeCount }} active / {{ v.customerCount }} total
                    </td>
                    <td
                      class="py-3.5 px-4 text-right font-mono font-semibold text-[var(--text-primary)] tabular-nums"
                    >
                      {{ formatCurrency(v.totalOutstanding) }}
                    </td>
                    <td class="py-3.5 px-4">
                      <glass-badge [variant]="v.is_active ? 'active' : 'neutral'">
                        {{ v.is_active ? 'Active' : 'Archived' }}
                      </glass-badge>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex items-center gap-2">
                        <a
                          [routerLink]="['/collections']"
                          [queryParams]="{ villageId: v.id }"
                          class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary-tint)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] hover:opacity-90 transition-opacity"
                        >
                          Collect
                        </a>
                        <button
                          type="button"
                          (click)="toggleActive(v)"
                          class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                          {{ v.is_active ? 'Archive' : 'Restore' }}
                        </button>
                      </div>
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
export class VillagesComponent implements OnInit {
  private readonly _supabase = inject(SupabaseService);
  private readonly _auth = inject(AuthService);

  villages = signal<Village[]>([]);
  customers = signal<Customer[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  newVillageName = '';

  villageSummaries = computed<VillageSummary[]>(() => {
    const custs = this.customers();
    return this.villages().map((v) => {
      const matching = custs.filter((c) => c.village_id === v.id);
      return {
        ...v,
        customerCount: matching.length,
        activeCount: matching.filter((c) => c.status === 'active').length,
        totalOutstanding: matching.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
      };
    });
  });

  activeVillageCount = computed(() => this.villages().filter((v) => v.is_active).length);
  assignedCustomersCount = computed(() => this.customers().filter((c) => !!c.village_id).length);
  totalVillageOutstanding = computed(() =>
    this.customers()
      .filter((c) => !!c.village_id)
      .reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
  );

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [vRes, cRes] = await Promise.all([
        this._supabase.client.from('villages').select('*').order('name', { ascending: true }),
        this._supabase.client
          .from('customers')
          .select('id, village_id, status, outstanding_balance'),
      ]);
      if (vRes.error) throw vRes.error;
      if (cRes.error) throw cRes.error;
      this.villages.set((vRes.data || []) as Village[]);
      this.customers.set((cRes.data || []) as Customer[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load villages');
    } finally {
      this.loading.set(false);
    }
  }

  async addVillage() {
    const name = this.newVillageName.trim();
    if (!name || this.saving()) return;

    const user = this._auth.user();
    if (!user?.id) {
      this.error.set('You must be signed in to add a village.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      const { data, error } = await this._supabase.client
        .from('villages')
        .insert({ profile_id: user.id, name })
        .select()
        .single();
      if (error) throw error;
      this.villages.update((list) =>
        [...list, data as Village].sort((a, b) => a.name.localeCompare(b.name)),
      );
      this.newVillageName = '';
      this.success.set(`Added village "${name}".`);
      setTimeout(() => this.success.set(null), 3500);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to add village');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(village: VillageSummary) {
    this.error.set(null);
    try {
      const next = !village.is_active;
      const { error } = await this._supabase.client
        .from('villages')
        .update({ is_active: next, updated_at: new Date().toISOString() })
        .eq('id', village.id);
      if (error) throw error;
      this.villages.update((list) =>
        list.map((v) => (v.id === village.id ? { ...v, is_active: next } : v)),
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update village');
    }
  }

  formatCurrency(paise: number): string {
    return formatPaiseToINR(paise || 0);
  }
}
