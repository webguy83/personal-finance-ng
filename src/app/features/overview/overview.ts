import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DonutChartComponent, DonutLegendItem, DonutSegment } from '../../core/components/donut-chart/donut-chart.component';
import { computeDonutSegments } from '../../core/utils/donut-chart';

const _d = (y: number, m: number, d: number) => Timestamp.fromDate(new Date(y, m - 1, d));

const MOCK_POTS = [
  { id: '1', name: 'Savings',        total: 159, target: 2000, theme: '#277C78' },
  { id: '2', name: 'Concert Ticket', total: 110, target:  150, theme: '#626070' },
  { id: '3', name: 'Gift',           total: 110, target:  150, theme: '#82C9D7' },
  { id: '4', name: 'New Laptop',     total:  10, target: 1000, theme: '#F2CDAC' },
];

const MOCK_TRANSACTIONS = [
  { id: '1', name: 'Emma Richardson',         amount:  75.50, date: _d(2025, 1, 19), avatar: '', category: 'General'        as const },
  { id: '2', name: 'Savory Bites Restaurant', amount: -55.50, date: _d(2025, 1, 19), avatar: '', category: 'Dining Out'     as const },
  { id: '3', name: 'Daniel Carter',           amount: -32.50, date: _d(2025, 1, 18), avatar: '', category: 'Transportation' as const },
  { id: '4', name: 'Sun Park',                amount: -10.00, date: _d(2025, 1, 17), avatar: '', category: 'Personal Care'  as const },
  { id: '5', name: 'Urban Services Ltd.',     amount:  -6.50, date: _d(2025, 1, 17), avatar: '', category: 'General'        as const },
];

const MOCK_BUDGETS = [
  { id: '1', category: 'Entertainment', maximum:  50, theme: '#277C78', spent:  15    },
  { id: '2', category: 'Bills',         maximum: 750, theme: '#82C9D7', spent: 150    },
  { id: '3', category: 'Dining Out',    maximum:  75, theme: '#F2CDAC', spent: 133.70 },
  { id: '4', category: 'Personal Care', maximum: 100, theme: '#626070', spent:  65    },
];

@Component({
  selector: 'app-overview',
  templateUrl: './overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, CurrencyPipe, DonutChartComponent, RouterLink],
  providers: [CurrencyPipe, DatePipe],
})
export class OverviewComponent {
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly datePipe = inject(DatePipe);

  protected readonly loading = signal(false);

  // ── Summary cards ────────────────────────────────────────
  protected readonly currentBalance = signal(4836.00);
  protected readonly income         = signal(3814.25);
  protected readonly expenses       = signal(1700.50);

  // ── Pots ────────────────────────────────────────────────
  protected readonly totalSaved = signal(389);
  protected readonly topPots    = signal(MOCK_POTS);

  // ── Transactions ────────────────────────────────────────
  protected readonly recentTransactions = signal(MOCK_TRANSACTIONS);

  // ── Budgets ─────────────────────────────────────────────
  protected readonly donutCenterLabel  = signal('$363.70');
  protected readonly donutCenterSub    = signal('of $975.00 limit');
  protected readonly donutSegments     = signal<DonutSegment[]>(computeDonutSegments(MOCK_BUDGETS));
  protected readonly budgetLegendItems = signal<DonutLegendItem[]>([
    { id: '1', theme: '#277C78', label: 'Entertainment', value: '$15.00',   sub: '' },
    { id: '2', theme: '#82C9D7', label: 'Bills',         value: '$150.00',  sub: '' },
    { id: '3', theme: '#F2CDAC', label: 'Dining Out',    value: '$133.70',  sub: '' },
    { id: '4', theme: '#626070', label: 'Personal Care', value: '$65.00',   sub: '' },
  ]);

  // ── Recurring Bills ─────────────────────────────────────
  protected readonly paidBillsTotal     = signal(190.00);
  protected readonly upcomingBillsTotal = signal(194.98);
  protected readonly dueSoonBillsTotal  = signal(59.98);

  protected formatDate(ts: Timestamp): string {
    return this.datePipe.transform(ts.toDate(), 'dd MMM y') ?? '';
  }

  protected formatAmount(amount: number): string {
    const formatted = this.currencyPipe.transform(Math.abs(amount), 'USD', 'symbol', '1.2-2') ?? '';
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }
}
