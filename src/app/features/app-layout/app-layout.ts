import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly loadingService = inject(LoadingService);

  readonly collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', icon: 'overview' },
    { label: 'Transactions', path: '/transactions', icon: 'transactions' },
    { label: 'Budgets', path: '/budgets', icon: 'budgets' },
    { label: 'Pots', path: '/pots', icon: 'pots' },
    { label: 'Recurring Bills', path: '/recurring-bills', icon: 'recurring-bills' },
  ];

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}

