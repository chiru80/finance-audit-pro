import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { CustomerService } from './customer.service';
import { Customer } from './customer.types';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  get isNew(): boolean {
    return !this.customerId();
  }

  form: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    email: ['', [Validators.email]],
    weekly_due_amount: [500, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  ngOnInit() {
    const routeId = this._route.snapshot.paramMap.get('id');
    const state = this._router.getCurrentNavigation()?.extras?.state as Record<string, unknown> | undefined;
    const targetId = routeId || (state?.['id'] as string | undefined);

    if (targetId) {
      this.customerId.set(targetId);
      this.loadCustomer(targetId);
    }
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
        this.form.patchValue({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          weekly_due_amount: (customer.weekly_due_amount || 50000) / 100,
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
