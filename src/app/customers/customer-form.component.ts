import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CustomerService } from './customer.service';
import { Customer } from './customer.types';
import { validatePhoneNumber } from '../utils/form-validation.utils';
import { GlassCardComponent } from '../design-system/components/glass-card.component';
import { GlassButtonComponent } from '../design-system/components/glass-button.component';
import { GlassInputDirective } from '../design-system/components/glass-input.directive';

function indianPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || control.value.trim() === '') return null;
  const errors = validatePhoneNumber(control.value);
  return errors.length > 0 ? { invalidPhone: errors[0] } : null;
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

  get isNew(): boolean {
    return !this.customerId();
  }

  // Get default weekly due in paise
  get defaultWeeklyDuePaise(): number {
    return Math.round(this.defaultWeeklyDue() * 100);
  }

  form: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [indianPhoneValidator]],
    email: ['', [Validators.email]],
    weekly_due_amount: [500, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  ngOnInit() {
    // Load default weekly due from settings/profile before form initialization
    this.loadDefaultWeeklyDue();

    const routeId = this._route.snapshot.paramMap.get('id');
    const state = this._router.getCurrentNavigation()?.extras?.state as Record<string, unknown> | undefined;
    const targetId = routeId || (state?.['id'] as string | undefined);

    if (targetId) {
      this.customerId.set(targetId);
      this.loadCustomer(targetId);
    }
  }

  private async loadDefaultWeeklyDue() {
    try {
      const user = this._authService.user();

      // First try to get default from settings
      const { data: settings } = await this._supabaseService.client
        .from('settings')
        .select('value')
        .eq('key', 'default_weekly_due_amount')
        .single();

      if (settings?.value) {
        const paise = parseInt(settings.value, 10);
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

  private async loadCustomer(id: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this._supabaseService.client
        .from('customers')
        .select('*')
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
          weekly_due_amount: Math.round(weeklyDuePaise / 100),
        });
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please check the form for invalid inputs.');
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

    try {
      const currentId = this.customerId();
      if (currentId) {
        await this._customerService.updateCustomer(currentId, {
          name: formValues.name.trim(),
          phone: formValues.phone?.trim() || '',
          email: formValues.email?.trim() || '',
          weekly_due_amount: paiseAmount,
        });
      } else {
        await this._customerService.createCustomer({
          name: formValues.name.trim(),
          phone: formValues.phone?.trim() || '',
          email: formValues.email?.trim() || '',
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
