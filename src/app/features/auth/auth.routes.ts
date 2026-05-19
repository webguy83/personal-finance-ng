import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
    ],
  },
];
