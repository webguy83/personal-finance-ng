import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { form, FormField, submit, required, min as minValidator } from '@angular/forms/signals';

import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DonutChartComponent, DonutLegendItem, DonutSegment } from '../../core/components/donut-chart/donut-chart.component';
import { DropdownComponent, DropdownOption } from '../../core/components/dropdown/dropdown.component';
import { ModalComponent } from '../../core/components/modal/modal.component';
import { BudgetService } from '../../core/services/budget.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { Budget, NewBudget } from '../../core/models/budget.model';
import { Transaction, TransactionCategory } from '../../core/models/transaction.model';
import { THEME_COLORS } from '../../core/constants/theme-colors';

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'General', 'Dining Out', 'Groceries', 'Entertainment', 'Bills',
  'Personal Care', 'Transportation', 'Education', 'Lifestyle', 'Shopping',
];


type EnrichedBudget = Budget & {
  spent: number;
  remaining: number;
  progressPct: number;
  recent: Transaction[];
};

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, CurrencyPipe, DatePipe, DonutChartComponent, FormField, DropdownComponent, RouterLink, ModalComponent],
  providers: [CurrencyPipe],
})
export class BudgetsComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly txService = inject(TransactionService);
  private readonly authService = inject(AuthService);
  private readonly currencyPipe = inject(CurrencyPipe);

  protected readonly loading = this.budgetService.loading;

  // ── Enriched budget data ─────────────────────────────────────────────────────
  protected readonly enrichedBudgets = computed((): EnrichedBudget[] => {
    const budgets = this.budgetService.budgets();
    const transactions = this.txService.transactions();
    return budgets.map((budget) => {
      const categoryTxs = transactions
        .filter((tx) => tx.category === budget.category && tx.amount < 0)
        .sort((a, b) => b.date.toMillis() - a.date.toMillis());
      const spent = categoryTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const remaining = Math.max(0, budget.maximum - spent);
      const progressPct = budget.maximum > 0 ? Math.min(100, (spent / budget.maximum) * 100) : 0;
      return { ...budget, spent, remaining, progressPct, recent: categoryTxs.slice(0, 3) };
    });
  });

  protected readonly totalSpent = computed(() =>
    this.enrichedBudgets().reduce((sum, b) => sum + b.spent, 0),
  );
  protected readonly totalBudget = computed(() =>
    this.enrichedBudgets().reduce((sum, b) => sum + b.maximum, 0),
  );

  protected readonly donutLegendItems = computed((): DonutLegendItem[] =>
    this.enrichedBudgets().map((b) => ({
      id: b.id,
      theme: b.theme,
      label: b.category,
      value: this.currencyPipe.transform(b.spent, 'USD', 'symbol', '1.0-2') ?? '',
      sub: 'of ' + (this.currencyPipe.transform(b.maximum, 'USD', 'symbol', '1.0-2') ?? ''),
    }))
  );

  // ── Donut chart ──────────────────────────────────────────────────────────────
  protected readonly donutSegments = computed((): DonutSegment[] => {
    const budgets = this.enrichedBudgets();
    const total = budgets.reduce((sum, b) => sum + b.maximum, 0);
    if (total === 0) {
      return [];
    }
    const C = 2 * Math.PI * 80;
    let offset = 0;
    return budgets.map((budget) => {
      const fullLen = (budget.maximum / total) * C;
      const displayLen = Math.max(0, fullLen);
      const seg = { id: budget.id, theme: budget.theme, dashArray: `${displayLen} ${C}`, dashOffset: -offset };
      offset += fullLen;
      return seg;
    });
  });

  // ── Card three-dot menu ──────────────────────────────────────────────────────
  protected readonly openMenuId = signal<string | null>(null);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuId.set(null);
  }

  protected toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId.update((curr) => (curr === id ? null : id));
  }

  // ── Add / Edit modal ─────────────────────────────────────────────────────────
  protected readonly showModal = signal(false);
  protected readonly editingBudget = signal<Budget | null>(null);
  protected readonly submitError = signal('');

  private readonly _formModel = signal<NewBudget>({
    category: TRANSACTION_CATEGORIES[0],
    maximum: 0,
    theme: THEME_COLORS[0].value,
  });

  protected readonly budgetForm = form(this._formModel, (s) => {
    required(s.category, { message: 'Category is required' });
    minValidator(s.maximum, 0.01, { message: 'Maximum must be greater than $0.00' });
  });

  protected readonly formCategory = computed(() => this._formModel().category);
  protected readonly formTheme = computed(() => this._formModel().theme);

  protected readonly modalCategoryOptions = computed((): DropdownOption[] => {
    const editing = this.editingBudget();
    const used = new Set(this.budgetService.budgets().map((b) => b.category));
    return TRANSACTION_CATEGORIES.filter((c) => !used.has(c) || c === editing?.category).map((c) => ({
      value: c,
      label: c,
    }));
  });

  protected readonly hasAvailableCategories = computed(() => {
    const used = new Set(this.budgetService.budgets().map((b) => b.category));
    return TRANSACTION_CATEGORIES.some((c) => !used.has(c));
  });

  protected readonly themeColorOptions = computed((): DropdownOption[] => {
    const editing = this.editingBudget();
    const usedThemes = new Set(
      this.budgetService.budgets()
        .filter((b) => b.id !== editing?.id)
        .map((b) => b.theme),
    );
    return THEME_COLORS.map((c) => ({
      value: c.value,
      label: c.label,
      color: c.value,
      ...(usedThemes.has(c.value) ? { secondaryLabel: 'Already used', disabled: true } : {}),
    }));
  });

  protected onCategoryChange(value: string): void {
    this._formModel.update((m) => ({ ...m, category: value as TransactionCategory }));
  }

  protected onThemeChange(color: string): void {
    this._formModel.update((m) => ({ ...m, theme: color }));
  }

  protected openAddModal(): void {
    const firstAvailable = (this.modalCategoryOptions()[0]?.value ?? TRANSACTION_CATEGORIES[0]) as TransactionCategory;
    const firstTheme = this.themeColorOptions().find((o) => !o.secondaryLabel)?.value ?? THEME_COLORS[0].value;
    this._formModel.set({ category: firstAvailable, maximum: 0, theme: firstTheme });
    this.editingBudget.set(null);
    this.submitError.set('');
    this.budgetForm().reset();
    this.showModal.set(true);
  }

  protected openEditModal(budget: EnrichedBudget): void {
    this.editingBudget.set(budget);
    this._formModel.set({ category: budget.category as TransactionCategory, maximum: budget.maximum, theme: budget.theme });
    this.submitError.set('');
    this.openMenuId.set(null);
    this.budgetForm().reset();
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
  }

  protected onSubmit(e: Event): void {
    e.preventDefault();
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    this.submitError.set('');
    submit(this.budgetForm, async () => {
      const { category, maximum, theme } = this._formModel();
      const editing = this.editingBudget();
      try {
        if (editing) {
          await this.budgetService.update(uid, editing.id, { category, maximum: Number(maximum), theme });
        } else {
          await this.budgetService.add(uid, { category, maximum: Number(maximum), theme });
        }
        this.closeModal();
      } catch {
        this.submitError.set('Failed to save budget. Please try again.');
      }
    });
  }

  // ── Delete confirm ───────────────────────────────────────────────────────────
  protected readonly deletingBudget = signal<Budget | null>(null);

  protected openDeleteConfirm(budget: EnrichedBudget): void {
    this.deletingBudget.set(budget);
    this.openMenuId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    const budget = this.deletingBudget();
    if (!uid || !budget) return;
    await this.budgetService.remove(uid, budget.id);
    this.deletingBudget.set(null);
  }

  protected cancelDelete(): void {
    this.deletingBudget.set(null);
  }


}

