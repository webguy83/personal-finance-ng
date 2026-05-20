import { Routes } from '@angular/router';
import { AppLayoutComponent } from './app-layout/app-layout';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/overview').then((m) => m.OverviewComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./transactions/transactions').then((m) => m.TransactionsComponent),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./budgets/budgets').then((m) => m.BudgetsComponent),
      },
      {
        path: 'pots',
        loadComponent: () =>
          import('./pots/pots').then((m) => m.PotsComponent),
      },
      {
        path: 'recurring-bills',
        loadComponent: () =>
          import('./recurring-bills/recurring-bills').then((m) => m.RecurringBillsComponent),
      },
    ],
  },
];
