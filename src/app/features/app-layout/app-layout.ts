import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../core/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../core/components/modal/modal.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, LoadingSpinnerComponent, ModalComponent],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly collapsed = signal(false);
  readonly showSignOutConfirm = signal(false);

  private readonly _pendingUrl = toSignal(
    this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => (e instanceof NavigationStart ? e.url : null)),
      startWith(null),
    ),
    { initialValue: null as string | null },
  );

  private readonly _currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Returns true immediately when a nav link is clicked, before the route resolves. */
  isTabActive(path: string): boolean {
    const url = this._pendingUrl() ?? this._currentUrl()!;
    return url === path || url.startsWith(path + '/');
  }

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

  openSignOutConfirm(): void {
    this.showSignOutConfirm.set(true);
  }

  cancelSignOut(): void {
    this.showSignOutConfirm.set(false);
  }

  async confirmSignOut(): Promise<void> {
    this.showSignOutConfirm.set(false);
    await this.authService.logout();
  }
}

