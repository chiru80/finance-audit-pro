import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassSwitchComponent } from '../design-system/components/glass-switch.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import { formatPaiseToINR } from '../utils/currency.utils';

type SettingsKey =
  | 'weekly_payments_start'
  | 'absence_requires_approval'
  | 'allow_partial_payments'
  | 'payment_allocation_direction'
  | 'default_weekly_due_day'
  | 'weekly_due_amount';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCardComponent,
    GlassButtonComponent,
    GlassSwitchComponent,
    GlassInputDirective,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  settings = signal({
    weekly_payments_start: true,
    absence_requires_approval: true,
    allow_partial_payments: true,
    payment_allocation_direction: 'fifo',
    default_weekly_due_day: 1,
    weekly_due_amount: 50000, // paise
  });

  weeklyDueRupees = signal<number>(500);

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this._supabaseService.client
        .from('settings')
        .select('*');

      if (error) throw error;

      const settingsMap = new Map(data?.map((s: any) => [s.key, s.value]) || []);

      // Also fetch profile defaults
      const user = this._authService.user();
      let profileDueAmount: number | null = null;
      let profileDueDay: number | null = null;

      if (user?.id) {
        const { data: profile } = await this._supabaseService.client
          .from('profiles')
          .select('weekly_due_amount, weekly_due_day')
          .eq('id', user.id)
          .single();

        if (profile) {
          profileDueAmount = profile.weekly_due_amount;
          profileDueDay = profile.weekly_due_day;
        }
      }

      // Priority: settings > profile > undefined (will use UI default)
      const dueAmountFromSettings = settingsMap.get('default_weekly_due_amount')
        ? parseInt(settingsMap.get('default_weekly_due_amount'), 10)
        : null;

      const dueDayFromSettings = settingsMap.get('default_weekly_due_day')
        ? parseInt(settingsMap.get('default_weekly_due_day'), 10)
        : null;

      const dueAmount = dueAmountFromSettings ?? profileDueAmount ?? 50000; // Ultimate fallback to ₹500
      const dueDay = dueDayFromSettings ?? profileDueDay ?? 1;

      this.settings.set({
        weekly_payments_start: settingsMap.get('weekly_payments_start') !== 'false',
        absence_requires_approval: settingsMap.get('absence_requires_approval') !== 'false',
        allow_partial_payments: settingsMap.get('allow_partial_payments') !== 'false',
        payment_allocation_direction: settingsMap.get('payment_allocation_direction') || 'fifo',
        default_weekly_due_day: dueDay,
        weekly_due_amount: dueAmount,
      });

      this.weeklyDueRupees.set(Math.floor(dueAmount / 100));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      this.loading.set(false);
    }
  }

  async updateCheckbox(key: 'weekly_payments_start' | 'absence_requires_approval' | 'allow_partial_payments', value: boolean) {
    await this.saveSetting(key, String(value));
    this.settings.set({ ...this.settings(), [key]: value });
  }

  async onSelectChange(key: 'payment_allocation_direction' | 'default_weekly_due_day', event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = key === 'default_weekly_due_day' ? parseInt(target.value, 10) : target.value;

    await this.saveSetting(key, String(value));

    if (key === 'default_weekly_due_day') {
      const user = this._authService.user();
      if (user?.id) {
        await this._supabaseService.client
          .from('profiles')
          .update({ weekly_due_day: value as number })
          .eq('id', user.id);
      }
    }

    this.settings.set({ ...this.settings(), [key]: value });
  }

  async onRupeeAmountSave() {
    const rupees = this.weeklyDueRupees();
    if (!rupees || rupees <= 0) {
      this.error.set('Please enter a valid weekly due amount in rupees');
      return;
    }

    const paise = Math.round(rupees * 100);
    await this.saveSetting('default_weekly_due_amount', String(paise));

    const user = this._authService.user();
    if (user?.id) {
      await this._supabaseService.client
        .from('profiles')
        .update({ weekly_due_amount: paise })
        .eq('id', user.id);
    }

    this.settings.set({ ...this.settings(), weekly_due_amount: paise });
    this.showSuccess('Weekly due amount updated');
  }

  private async saveSetting(key: string, value: string) {
    try {
      this.error.set(null);
      const { error } = await this._supabaseService.client
        .from('settings')
        .upsert({ key, value });

      if (error) throw error;
      this.showSuccess('Settings updated successfully');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update setting');
    }
  }

  private showSuccess(message: string) {
    this.success.set(message);
    setTimeout(() => this.success.set(null), 3000);
  }

  formatCurrency(amount: number | bigint) {
    return formatPaiseToINR(amount || 0);
  }
}

