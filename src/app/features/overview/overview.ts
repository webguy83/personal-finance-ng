import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DonutChartComponent, DonutLegendItem, DonutSegment } from '../../core/components/donut-chart/donut-chart.component';
import { computeDonutSegments } from '../../core/utils/donut-chart';
import { BillStatus, getBillStatus, isCurrentMonth } from '../../core/utils/recurring-bill.utils';
import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService } from '../../core/services/budget.service';
import { PotService } from '../../core/services/pot.service';
import { RecurringBillService } from '../../core/services/recurring-bill.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, CurrencyPipe, DonutChartComponent, RouterLink],
  providers: [CurrencyPipe, DatePipe],
})
export class OverviewComponent {
  private readonly txService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);
  private readonly potService = inject(PotService);
  private readonly billService = inject(RecurringBillService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly datePipe = inject(DatePipe);

  // ── Summary cards ────────────────────────────────────────
  protected readonly currentBalance = computed(() =>
    this.txService.transactions().reduce((sum, t) => sum + t.amount, 0)
  );

  protected readonly income = computed(() =>
    this.txService.transactions()
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  protected readonly expenses = computed(() =>
    this.txService.transactions()
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );

  // ── Pots ────────────────────────────────────────────────
  protected readonly totalSaved = computed(() =>
    this.potService.pots().reduce((sum, p) => sum + p.total, 0)
  );

  protected readonly topPots = computed(() => this.potService.pots().slice(0, 4));

  // ── Transactions ────────────────────────────────────────
  protected readonly recentTransactions = computed(() =>
    this.txService.transactions().slice(0, 5)
  );

  protected formatDate(ts: Timestamp): string {
    return this.datePipe.transform(ts.toDate(), 'dd MMM y') ?? '';
  }

  protected formatAmount(amount: number): string {
    const formatted = this.currencyPipe.transform(Math.abs(amount), 'USD', 'symbol', '1.2-2') ?? '';
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  // ── Budgets ─────────────────────────────────────────────
  private readonly enrichedBudgets = computed(() => {
    const budgets = this.budgetService.budgets();
    const transactions = this.txService.transactions();
    return budgets.map(budget => {
      const spent = transactions
        .filter(tx => tx.category === budget.category && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { ...budget, spent };
    });
  });

  protected readonly totalBudgetSpent = computed(() =>
    this.enrichedBudgets().reduce((sum, b) => sum + b.spent, 0)
  );

  protected readonly totalBudgetLimit = computed(() =>
    this.enrichedBudgets().reduce((sum, b) => sum + b.maximum, 0)
  );

  protected readonly donutCenterLabel = computed(() =>
    this.currencyPipe.transform(this.totalBudgetSpent(), 'USD', 'symbol', '1.2-2') ?? ''
  );

  protected readonly donutCenterSub = computed(() => {
    const limit = this.currencyPipe.transform(this.totalBudgetLimit(), 'USD', 'symbol', '1.2-2') ?? '';
    return `of ${limit} limit`;
  });

  protected readonly donutSegments = computed((): DonutSegment[] =>
    computeDonutSegments(this.enrichedBudgets())
  );

  protected readonly budgetLegendItems = computed((): DonutLegendItem[] =>
    this.enrichedBudgets().map(b => ({
      id: b.id,
      theme: b.theme,
      label: b.category,
      value: this.currencyPipe.transform(b.spent, 'USD', 'symbol', '1.2-2') ?? '',
      sub: '',
    }))
  );

  // ── Recurring Bills ─────────────────────────────────────
  private readonly currentMonthBills = computed(() => {
    const now = new Date();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return this.billService.bills()
      .filter(b => isCurrentMonth(b.dueDate.toDate(), now))
      .map(b => {
        const d = b.dueDate.toDate();
        const status = getBillStatus(d, todayMs);
        return { ...b, status };
      });
  });

  protected readonly paidBillsTotal = computed(() =>
    this.currentMonthBills()
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0)
  );

  protected readonly upcomingBillsTotal = computed(() =>
    this.currentMonthBills()
      .filter(b => b.status !== 'paid')
      .reduce((sum, b) => sum + b.amount, 0)
  );

  protected readonly dueSoonBillsTotal = computed(() =>
    this.currentMonthBills()
      .filter(b => b.status === 'dueSoon')
      .reduce((sum, b) => sum + b.amount, 0)
  );
}
