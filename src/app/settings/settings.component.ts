import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { PushNotificationService } from '../core/push-notification.service';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassSwitchComponent } from '../design-system/components/glass-switch.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import type { GlassDropdownItem } from '../design-system/components/glass-dropdown.component';
import { GlassDropdownComponent } from '../design-system/components/glass-dropdown.component';
import { formatPaiseToINR } from '../utils/currency.utils';
import { extractErrorMessage } from '../utils/error.utils';
import { I18nPipe } from '../shared/i18n.pipe';

interface WhatsAppConfig {
  base_url: string;
  api_key: string;
  session_name: string;
}

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
    GlassDropdownComponent,
    I18nPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  protected readonly push = inject(PushNotificationService);

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
    loan_deduction_mode: 'fixed_per_1000',
    loan_deduction_per_1000: 0,
  });

  weeklyDueRupees = signal<number>(500);

  // Dropdown items
  dueDayItems: GlassDropdownItem[] = [
    { label: 'Monday (Cycle Start)', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
  ];

  allocationDirectionItems: GlassDropdownItem[] = [
    { label: 'FIFO : Oldest Unpaid Dues First (Approved Policy)', value: 'fifo' },
    { label: 'LIFO : Newest Dues First', value: 'lifo' },
  ];

  // NEW: Deduction per 1000 presets allowed by business
  deductionPresets: GlassDropdownItem[] = [
    { label: 'Full Amount (0 Rs deduction)', value: 0 },
    { label: 'Rs 10 per Rs 1000', value: 10 },
    { label: 'Rs 20 per Rs 1000', value: 20 },
    { label: 'Rs 30 per Rs 1000', value: 30 },
    { label: 'Rs 50 per Rs 1000', value: 50 },
  ];

  // WhatsApp config
  whatsappLoading = signal(false);
  whatsappConfig = signal<WhatsAppConfig | null>(null);
  whatsappForm = signal<WhatsAppConfig>({
    base_url: '',
    api_key: '',
    session_name: 'finance-audit-pro',
  });
  whatsappTestLoading = signal(false);
  whatsappTestResult = signal<string | null>(null);

  // Push notifications
  vapidPublicKey = signal<string>('');

  ngOnInit() {
    this.loadSettings();
    this.loadWhatsAppConfig();
    this.push.refreshStatus();
  }

  async loadSettings() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this._supabaseService.client.from('settings').select('*');

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

      const deductionModeFromSettings = settingsMap.get('loan_deduction_mode') || 'fixed_per_1000';
      const deductionPer1000Raw = settingsMap.get('loan_deduction_per_1000');
      const deductionPer1000 =
        deductionPer1000Raw !== undefined ? parseInt(deductionPer1000Raw, 10) : 0;

      this.settings.set({
        weekly_payments_start: settingsMap.get('weekly_payments_start') !== 'false',
        absence_requires_approval: settingsMap.get('absence_requires_approval') !== 'false',
        allow_partial_payments: settingsMap.get('allow_partial_payments') !== 'false',
        payment_allocation_direction: settingsMap.get('payment_allocation_direction') || 'fifo',
        default_weekly_due_day: dueDay,
        weekly_due_amount: dueAmount,
        loan_deduction_mode: deductionModeFromSettings,
        loan_deduction_per_1000: deductionPer1000,
      });

      this.weeklyDueRupees.set(Math.floor(dueAmount / 100));
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to load settings'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadWhatsAppConfig() {
    try {
      const { data, error } = await this._supabaseService.client
        .from('app_whatsapp_config')
        .select('base_url, api_key, session_name')
        .eq('id', true)
        .single();

      if (error) throw error;
      if (data) {
        this.whatsappConfig.set(data);
        this.whatsappForm.set({
          base_url: data.base_url || '',
          api_key: data.api_key || '',
          session_name: data.session_name || 'finance-audit-pro',
        });
      }
    } catch (err) {
      console.warn('WhatsApp config not loaded:', err);
    }
  }

  async saveWhatsAppConfig() {
    const form = this.whatsappForm();
    if (!form.base_url || !form.api_key) {
      this.error.set('Base URL and API Key are required');
      return;
    }

    this.whatsappLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const { error } = await this._supabaseService.client.from('app_whatsapp_config').upsert({
        id: true,
        base_url: form.base_url,
        api_key: form.api_key,
        session_name: form.session_name,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      this.whatsappConfig.set({ ...form });
      this.showSuccess('WhatsApp configuration saved');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save WhatsApp config');
    } finally {
      this.whatsappLoading.set(false);
    }
  }

  async testWhatsAppConnection() {
    this.whatsappTestLoading.set(true);
    this.whatsappTestResult.set(null);
    this.error.set(null);

    try {
      // Try to get owner's phone from profile for test
      const user = this._authService.user();
      let testPhone = '+919876543210'; // Fallback placeholder

      if (user?.id) {
        const { data: profile } = await this._supabaseService.client
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();

        if (profile?.phone) {
          testPhone = profile.phone;
        }
      }

      const { data, error } = await this._supabaseService.client.functions.invoke(
        'whatsapp-send-report',
        {
          body: {
            reportType: 'summary',
            recipientPhone: testPhone,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
        },
      );

      if (error) throw error;
      this.whatsappTestResult.set(
        'Connection successful! Message ID: ' + (data?.messageId || 'unknown'),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      if (msg.includes('409') || msg.includes('session not ready')) {
        this.whatsappTestResult.set(
          'Gateway reachable, but WhatsApp session not linked. Scan QR in OpenWA dashboard.',
        );
      } else if (msg.includes('401') || msg.includes('Invalid API key')) {
        this.whatsappTestResult.set('Invalid API key. Check your credentials.');
      } else if (msg.includes('404') || msg.includes('session not found')) {
        this.whatsappTestResult.set('Session not found. Check session name in OpenWA.');
      } else {
        this.whatsappTestResult.set('Error: ' + msg);
      }
    } finally {
      this.whatsappTestLoading.set(false);
    }
  }

  onWhatsAppInputChange(field: keyof WhatsAppConfig, value: string) {
    this.whatsappForm.update((prev) => ({ ...prev, [field]: value }));
  }

  async updateCheckbox(
    key: 'weekly_payments_start' | 'absence_requires_approval' | 'allow_partial_payments',
    value: boolean,
  ) {
    await this.saveSetting(key, String(value));
    this.settings.set({ ...this.settings(), [key]: value });
  }

  async onDueDayChange(value: number) {
    await this.saveSetting('default_weekly_due_day', String(value));

    const user = this._authService.user();
    if (user?.id) {
      await this._supabaseService.client
        .from('profiles')
        .update({ weekly_due_day: value })
        .eq('id', user.id);
    }

    this.settings.set({ ...this.settings(), default_weekly_due_day: value });
  }

  async onAllocationDirectionChange(value: string) {
    await this.saveSetting('payment_allocation_direction', value);
    this.settings.set({ ...this.settings(), payment_allocation_direction: value });
  }

  async onDeductionChange(value: number) {
    const deduction = Number(value);
    if (![0, 10, 20, 30, 50].includes(deduction)) {
      this.error.set('Invalid deduction preset');
      return;
    }
    await this.saveSetting('loan_deduction_per_1000', String(deduction));
    this.settings.set({ ...this.settings(), loan_deduction_per_1000: deduction });
    this.showSuccess('Deduction preset updated');
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
      const { error } = await this._supabaseService.client.from('settings').upsert({ key, value });

      if (error) throw error;
      this.showSuccess('Settings updated successfully');
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to update setting'));
    }
  }

  private showSuccess(message: string) {
    this.success.set(message);
    setTimeout(() => this.success.set(null), 3000);
  }

  async enablePush() {
    const key = this.vapidPublicKey().trim();
    if (!key) {
      this.error.set('Enter a VAPID public key first.');
      return;
    }
    const ok = await this.push.subscribe(key);
    if (ok) this.showSuccess('Push notifications enabled');
  }

  async disablePush() {
    await this.push.unsubscribe();
    this.showSuccess('Push notifications disabled');
  }

  formatCurrency(amount: number | bigint) {
    return formatPaiseToINR(amount || 0);
  }
}
