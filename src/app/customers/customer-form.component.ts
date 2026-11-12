import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
})
export class CustomerFormComponent implements OnInit {
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  customerId = signal<string | null>(null);

  name = signal('');
  phone = signal('');
  email = signal('');
  address = signal('');
  weeklyDueAmount = signal(500);

  ngOnInit() {
    const id = this._router.getCurrentNavigation()?.extras?.state?.['id'];
    if (id) {
      this.isEditMode.set(true);
      this.customerId.set(id);
      this.loadCustomer(id);
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
        this.name.set(data.name || '');
        this.phone.set(data.phone || '');
        this.email.set(data.email || '');
        this.address.set(data.address || '');
        this.weeklyDueAmount.set((data.weekly_due_amount || 50000) / 100);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  async saveCustomer() {
    if (!this.name().trim()) {
      this.error.set('Customer name is required');
      return;
    }

    const user = this._authService.user();
    if (!user) {
      this.error.set('You must be logged in to save a customer');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const paiseAmount = Math.round(this.weeklyDueAmount() * 100);

    try {
      if (this.isEditMode() && this.customerId()) {
        const { error } = await this._supabaseService.client
          .from('customers')
          .update({
            name: this.name().trim(),
            phone: this.phone().trim() || null,
            email: this.email().trim() || null,
            address: this.address().trim() || null,
            weekly_due_amount: paiseAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.customerId()!);

        if (error) throw error;
      } else {
        const { error } = await this._supabaseService.client
          .from('customers')
          .insert({
            profile_id: user.id,
            name: this.name().trim(),
            phone: this.phone().trim() || null,
            email: this.email().trim() || null,
            address: this.address().trim() || null,
            weekly_due_amount: paiseAmount,
            enrollment_week_start: new Date().toISOString().split('T')[0],
            status: 'active',
            outstanding_balance: 0,
            total_paid: 0,
            total_due: paiseAmount,
          });

        if (error) throw error;
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
