import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';

type SettingsKey = 'weekly_payments_start' | 'absence_requires_approval' | 'allow_partial_payments' | 'payment_allocation_direction' | 'default_weekly_due_day' | 'weekly_due_amount';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);

  settings = signal({
    weekly_payments_start: true,
    absence_requires_approval: true,
    allow_partial_payments: true,
    payment_allocation_direction: 'fifo',
    default_weekly_due_day: 1,
    weekly_due_amount: 50000,
  });

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const { data, error } = await this._supabaseService.client
        .from('settings')
        .select('*');

      if (error) throw error;

      const settingsMap = new Map(data?.map((s: any) => [s.key, s.value]) || []);

      this.settings.set({
        weekly_payments_start: settingsMap.get('weekly_payments_start') === 'true',
        absence_requires_approval: settingsMap.get('absence_requires_approval') === 'true',
        allow_partial_payments: settingsMap.get('allow_partial_payments') === 'true',
        payment_allocation_direction: settingsMap.get('payment_allocation_direction') || 'fifo',
        default_weekly_due_day: parseInt(settingsMap.get('default_weekly_due_day') || '1', 10),
        weekly_due_amount: parseInt(settingsMap.get('default_weekly_due_amount') || '50000', 10),
      });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load settings');
    }
    this.loading.set(false);
  }

  onCheckboxChange(key: SettingsKey, event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateSetting(key, target.checked);
  }

  onWeeklyDueAmountInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (!isNaN(value) && value > 0) {
      this.updateSetting('weekly_due_amount', value);
    }
  }

  onSelectChange(key: 'payment_allocation_direction' | 'default_weekly_due_day', event: Event) {
    const target = event.target as HTMLSelectElement;
    if (key === 'default_weekly_due_day') {
      this.updateSetting(key, parseInt(target.value, 10));
    } else {
      this.updateSetting(key, target.value);
    }
  }

  private async updateSetting(key: SettingsKey, value: string | number | boolean) {
    try {
      const { error } = await this._supabaseService.client
        .from('settings')
        .update({ value: String(value) })
        .eq('key', key);

      if (error) throw error;

      const current = this.settings();
      this.settings.set({ ...current, [key]: value });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update setting');
    }
  }

  formatCurrency(amount: number | undefined | null) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((amount ?? 0) / 100);
  }
}
