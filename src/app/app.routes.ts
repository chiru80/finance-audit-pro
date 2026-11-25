import type { Routes } from '@angular/router';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { adminGuard } from './auth/auth.guard';

// Guard for authentication
const canAuthenticate = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  try {
    const session = await supabase.getSession();
    if (session?.data?.session?.user) {
      return true;
    }
  } catch (err) {
    console.warn('Session check failed or Supabase unreachable:', err);
  }
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth/oauth-callback.component').then((m) => m.OauthCallbackComponent),
  },
  {
    path: 'dashboard',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./dashboard/premium-dashboard.component').then((m) => m.PremiumDashboardComponent),
  },
  {
    path: 'customers',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
  },
  {
    path: 'customers/new',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./customers/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'customers/:id',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./customers/customer-detail.component').then((m) => m.CustomerDetailComponent),
  },
  {
    path: 'customers/:id/edit',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./customers/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'collections',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./collections/collection-entry.component').then((m) => m.CollectionEntryComponent),
  },
  {
    path: 'outbox',
    canActivate: [() => canAuthenticate()],
    loadComponent: () => import('./collections/outbox.component').then((m) => m.OutboxComponent),
  },
  {
    path: 'ledger',
    canActivate: [() => canAuthenticate()],
    loadComponent: () => import('./ledger/ledger.component').then((m) => m.LedgerComponent),
  },
  {
    path: 'reports',
    canActivate: [() => canAuthenticate()],
    loadComponent: () => import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'online-payments',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./online-payments/online-payments.component').then((m) => m.OnlinePaymentsComponent),
  },
  {
    path: 'audit-log',
    canActivate: [() => canAuthenticate()],
    loadComponent: () => import('./audit-log/audit-log.component').then((m) => m.AuditLogComponent),
  },
  {
    path: 'settings',
    canActivate: [adminGuard],
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
