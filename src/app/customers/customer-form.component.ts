import type { OnInit } from '@angular/core';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CustomerService } from './customer.service';
import type { Customer, Village } from './customer.types';
import { validatePhoneNumber } from '../utils/form-validation.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';
import type { GlassDropdownItem } from '../design-system/components/glass-dropdown.component';
import { GlassDropdownComponent } from '../design-system/components/glass-dropdown.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

function indianPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || String(control.value).trim() === '') return null;
  const errors = validatePhoneNumber(String(control.value).trim());
  return errors.length > 0 ? { invalidPhone: errors[0] } : null;
}

function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || String(control.value).trim() === '') return null;
  return Validators.email({ ...control, value: String(control.value).trim() } as AbstractControl);
}

function loanAmountValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || control.value <= 0) {
    return { minLoanAmount: 'Loan amount must be greater than 0' };
  }
  return null;
}

function weeksValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value || value < 1 || value > 52) {
    return { invalidWeeks: 'Number of weeks must be between 1 and 52' };
  }
  return null;
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GlassCardComponent,
    GlassButtonComponent,
    GlassInputDirective,
    GlassDropdownComponent,
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
})
export class CustomerFormComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _customerService = inject(CustomerService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  customerId = signal<string | null>(null);
  defaultWeeklyDue = signal<number>(500); // In rupees, fetched from settings/profile
  loadingDefaults = signal(true);

  // Village handling
  villages = signal<Village[]>([]);
  loadingVillages = signal(true);

  // Week presets
  weekPresets = [12, 21, 25];
  showCustomWeeks = signal(false);

  // Deduction per Rs 1000 (from settings) — used to auto-load "amount given"
  deductionPer1000 = signal<number>(0);

  // Amount Given is DERIVED from loan_amount and the deduction preset.
  // The customer never receives the full loan amount when a deduction is set.
  // amount_given = loan_amount - loan_amount * (deduction_per_1000 / 1000)
  // Stored in paise on the customer; displayed in rupees on the form.
  amountGivenRupees = computed(() => {
    const loan = Number(this._loanAmountSignal()) || 0;
    const deduction = this.deductionPer1000();
    if (deduction <= 0) return loan;
    return Math.round(loan - loan * (deduction / 1000));
  });

  // Formatted values for display in the deduction preview card
  amountGivenFormatted = computed(() => {
    return this.amountGivenRupees().toLocaleString('en-IN');
  });

  deductionFormatted = computed(() => {
    const loan = Number(this._loanAmountSignal()) || 0;
    const deduction = this.deductionPer1000();
    if (deduction <= 0) return '0';
    return Math.round(loan * (deduction / 1000)).toLocaleString('en-IN');
  });

  deductionRateLabel = computed(() => {
    const rate = this.deductionPer1000();
    if (rate === 0) return 'Full Amount (no deduction)';
    return `Rs ${rate} per Rs 1000`;
  });

  get isNew(): boolean {
    return !this.customerId();
  }

  // Get default weekly due in paise
  get defaultWeeklyDuePaise(): number {
    return Math.round(this.defaultWeeklyDue() * 100);
  }

  form: FormGroup = this._fb.group({
    // Section 1: Personal Details
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [indianPhoneValidator]],
    email: ['', [optionalEmailValidator]],

    // Section 2: Loan Details
    enrollment_date: ['', [Validators.required]],
    village_id: ['', [Validators.required]],
    loan_amount: [0, [Validators.required, loanAmountValidator]],
    // amount_given is auto-computed from loan_amount + deduction setting.
    // Stored in the form so patchValue works on edit and onSubmit can read it.
    amount_given: [{ value: 0, disabled: true }],
    total_weeks: [12, [Validators.required, weeksValidator]],

    // Section 3: Collection Terms
    weekly_due_amount: [500, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  // Track loan_amount as a signal so preview computeds react to keystrokes.
  // (Form control .value is not a signal, so plain reads in computed() would not re-run.)
  private readonly _loanAmountSignal = toSignal(
    this.form.get('loan_amount')!.valueChanges.pipe(
      startWith(this.form.get('loan_amount')!.value),
      // The valueChanges stream emits "string | null" for number inputs; coerce to number.
      // No need for an explicit map here – we coerce in the computed.
    ),
    { initialValue: 0 },
  );

  presetAmounts = [200, 300, 500, 1000, 2000];

  setWeeklyAmount(amount: number) {
    this.form.get('weekly_due_amount')?.setValue(amount);
    this.form.get('weekly_due_amount')?.markAsDirty();
  }

  selectWeeks(weeks: number) {
    this.form.get('total_weeks')?.setValue(weeks);
    this.form.get('total_weeks')?.markAsDirty();
    this.showCustomWeeks.set(false);
  }

  toggleCustomWeeks() {
    this.showCustomWeeks.set(!this.showCustomWeeks());
    if (!this.showCustomWeeks()) {
      // Reset to default preset when closing custom
      this.form.get('total_weeks')?.setValue(12);
    }
  }

  ngOnInit() {
    // Load default weekly due from settings/profile before form initialization
    this.loadDefaultWeeklyDue();
    this.loadVillages();

    const routeId = this._route.snapshot.paramMap.get('id');
    const state = this._router.getCurrentNavigation()?.extras?.state as
      Record<string, unknown> | undefined;
    const targetId = routeId || (state?.['id'] as string | undefined);

    if (targetId) {
      this.customerId.set(targetId);
      this.loadCustomer(targetId);
    } else {
      // Set default enrollment date to today for new customers
      const today = new Date().toISOString().split('T')[0];
      this.form.get('enrollment_date')?.setValue(today, { emitEvent: false });
      const preselectedVillageId = this._route.snapshot.queryParamMap.get('villageId');
      if (preselectedVillageId) {
        this.form.get('village_id')?.setValue(preselectedVillageId, { emitEvent: false });
      }
    }
  }

  private async loadDefaultWeeklyDue() {
    try {
      const user = this._authService.user();

      // First try to get default from settings
      const { data: settings } = await this._supabaseService.client
        .from('settings')
        .select('key, value')
        .in('key', ['default_weekly_due_amount', 'loan_deduction_per_1000']);

      const settingsMap = new Map((settings || []).map((s: any) => [s.key, s.value]));

      const dueRaw = settingsMap.get('default_weekly_due_amount');
      if (dueRaw) {
        const paise = parseInt(dueRaw, 10);
        this.defaultWeeklyDue.set(Math.round(paise / 100));
        this.updateFormDefault();
      } else if (user?.id) {
        // Fallback to profile's weekly_due_amount
        const { data: profile } = await this._supabaseService.client
          .from('profiles')
          .select('weekly_due_amount')
          .eq('id', user.id)
          .single();

        if (profile?.weekly_due_amount) {
          this.defaultWeeklyDue.set(Math.round(profile.weekly_due_amount / 100));
          this.updateFormDefault();
        }
      }

      const deductionRaw = settingsMap.get('loan_deduction_per_1000');
      if (deductionRaw !== undefined) {
        const parsed = parseInt(deductionRaw, 10);
        this.deductionPer1000.set([0, 10, 20, 30, 50].includes(parsed) ? parsed : 0);
      }
    } catch (err) {
      // Keep default 500 if settings/profile fetch fails
      console.warn('Could not load default weekly due:', err);
      this.updateFormDefault();
    } finally {
      this.loadingDefaults.set(false);
    }
  }

  private updateFormDefault() {
    this.form.get('weekly_due_amount')?.setValue(this.defaultWeeklyDue(), { emitEvent: false });
  }

  private async loadVillages() {
    try {
      await this._customerService.loadVillages();
      this.villages.set(this._customerService.villages());
    } catch (err) {
      console.error('Failed to load villages:', err);
      this.villages.set([]);
    } finally {
      this.loadingVillages.set(false);
    }
  }

  private async loadCustomer(id: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select(
          `
          *,
          villages(name)
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        const customer = data as Customer;
        // Use customer's weekly_due_amount, or fall back to default from settings/profile
        const weeklyDuePaise = customer.weekly_due_amount ?? this.defaultWeeklyDuePaise;
        this.form.patchValue({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          enrollment_date: customer.enrollment_date
            ? new Date(customer.enrollment_date).toISOString().split('T')[0]
            : '',
          village_id: customer.village_id || '',
          loan_amount: Math.round((customer.loan_amount || 0) / 100),
          amount_given: Math.round((customer.amount_given || 0) / 100),
          total_weeks: customer.total_weeks || 12,
          weekly_due_amount: Math.round(weeklyDuePaise / 100),
        });

        // Update showCustomWeeks based on loaded value
        const loadedWeeks = customer.total_weeks || 12;
        this.showCustomWeeks.set(!this.weekPresets.includes(loadedWeeks));
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  get villageDropdownItems(): GlassDropdownItem[] {
    return this.villages().map((v) => ({
      label: v.name,
      value: v.id,
    }));
  }

  get todayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  async createNewVillage(name: string) {
    try {
      const newVillage = await this._customerService.createVillage(name);
      if (newVillage) {
        this.villages.set(this._customerService.villages());
        this.form.get('village_id')?.setValue(newVillage.id);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create village');
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const fieldLabels: Record<string, string> = {
        name: 'Full Legal Name',
        phone: 'Mobile Number',
        email: 'Email Address',
        enrollment_date: 'Loan Date',
        village_id: 'Village',
        loan_amount: 'Loan Amount',
        total_weeks: 'Loan Tenure',
        weekly_due_amount: 'Weekly Installment Target',
      };
      const invalidFields = Object.keys(this.form.controls)
        .filter((key) => this.form.controls[key].invalid)
        .map((key) => fieldLabels[key] || key);
      this.error.set(
        invalidFields.length
          ? `Please check the form for invalid inputs: ${invalidFields.join(', ')}.`
          : 'Please check the form for invalid inputs.',
      );
      return;
    }

    const user = this._authService.user();
    if (!user) {
      this.error.set('You must be logged in to save a customer');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValues = this.form.value;
    const paiseAmount = Math.round(Number(formValues.weekly_due_amount) * 100);
    const loanPaise = Math.round(Number(formValues.loan_amount) * 100);
    const deductionPaise = Math.round(
      Number(formValues.loan_amount) * 100 * (this.deductionPer1000() / 1000),
    );
    const amountGivenPaise = loanPaise - deductionPaise;

    try {
      const currentId = this.customerId();
      if (currentId) {
        await this._customerService.updateCustomer(currentId, {
          name: formValues.name.trim(),
          phone: formValues.phone?.trim() || '',
          email: formValues.email?.trim() || '',
          enrollment_date: formValues.enrollment_date,
          village_id: formValues.village_id,
          loan_amount: loanPaise,
          amount_given: amountGivenPaise,
          total_weeks: formValues.total_weeks,
          weekly_due_amount: paiseAmount,
        });
      } else {
        await this._customerService.createCustomer({
          name: formValues.name.trim(),
          phone: formValues.phone?.trim() || '',
          email: formValues.email?.trim() || '',
          enrollment_date: formValues.enrollment_date,
          village_id: formValues.village_id,
          loan_amount: loanPaise,
          amount_given: amountGivenPaise,
          total_weeks: formValues.total_weeks,
          weekly_due_amount: paiseAmount,
        });
      }

      this._router.navigate(['/customers']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      this.loading.set(false);
    }
  }

  cancel() {
    this._router.navigate(['/customers']);
  }
}
