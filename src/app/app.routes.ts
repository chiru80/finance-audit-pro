import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

// Guard for authentication
const canAuthenticate = () => {
  const supabase = inject(SupabaseService);
  return supabase.getSession().then(session => !!session?.data.session?.user);
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
    path: 'dashboard',
    canActivate: [() => canAuthenticate()],
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
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
    path: 'ledger',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./ledger/ledger.component').then((m) => m.LedgerComponent),
  },
  {
    path: 'reports',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'settings',
    canActivate: [() => canAuthenticate()],
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];