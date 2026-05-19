import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: 'auth',
    children: authRoutes,
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/features.routes').then((m) => m.appRoutes),
  },
  { path: '**', redirectTo: '/overview' },
];
