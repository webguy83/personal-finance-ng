import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { form, FormField, submit, required, min as minValidator } from '@angular/forms/signals';
import { Timestamp } from 'firebase/firestore';
import { ActivatedRoute } from '@angular/router';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DropdownComponent, DropdownOption } from '../../core/components/dropdown/dropdown.component';
import { ModalComponent } from '../../core/components/modal/modal.component';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { TransactionCategory, NewTransaction } from '../../core/models/transaction.model';

type SortOption = 'latest' | 'oldest' | 'az' | 'za' | 'highest' | 'lowest';

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'General',
  'Dining Out',
  'Groceries',
  'Entertainment',
  'Bills',
  'Personal Care',
  'Transportation',
  'Education',
  'Lifestyle',
  'Shopping',
];

const PAGE_SIZE = 10;

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, FormField, DropdownComponent, ModalComponent],
  providers: [DatePipe],
})
export class TransactionsComponent {
  private readonly txService = inject(TransactionService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);

  protected readonly categories = TRANSACTION_CATEGORIES;

  protected readonly categoryOptions: DropdownOption[] = [
    { value: 'All Transactions', label: 'All Transactions' },
    ...TRANSACTION_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  protected readonly categoryFormOptions: DropdownOption[] =
    TRANSACTION_CATEGORIES.map((c) => ({ value: c, label: c }));

  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'az', label: 'A to Z' },
    { value: 'za', label: 'Z to A' },
    { value: 'highest', label: 'Highest' },
    { value: 'lowest', label: 'Lowest' },
  ];

  // ── Toolbar state ────────────────────────────────────────
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<SortOption>('latest');
  protected readonly categoryFilter = signal<TransactionCategory | 'All Transactions'>(
    this.categoryFromQueryParam()
  );
  protected readonly currentPage = signal(1);

  // ── Service data ─────────────────────────────────────────
  protected readonly loading = this.txService.loading;

  // ── Derived / computed ───────────────────────────────────
  protected readonly filtered = computed(() => {
    let txs = this.txService.transactions();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.categoryFilter();
    const sort = this.sortBy();

    if (q) txs = txs.filter((tx) => tx.name.toLowerCase().includes(q));
    if (cat !== 'All Transactions') txs = txs.filter((tx) => tx.category === cat);

    switch (sort) {
      case 'oldest':
        return [...txs].sort((a, b) => a.date.seconds - b.date.seconds);
      case 'az':
        return [...txs].sort((a, b) => a.name.localeCompare(b.name));
      case 'za':
        return [...txs].sort((a, b) => b.name.localeCompare(a.name));
      case 'highest':
        return [...txs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      case 'lowest':
        return [...txs].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
      default:
        return txs; // 'latest' = Firestore's orderBy desc
    }
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly pageNumbers = computed((): (number | '...')[] => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
      pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  // Compact variant for mobile — same ±1 window as desktop but max 5 page items
  protected readonly mobilePageNumbers = computed((): (number | '...')[] => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
      pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  constructor() {
    // Reset to page 1 whenever any filter/sort changes
    effect(() => {
      this.searchQuery();
      this.categoryFilter();
      this.sortBy();
      untracked(() => this.currentPage.set(1));
    });
  }

  // ── Add Transaction modal ────────────────────────────────
  protected readonly showAddModal = signal(false);
  protected readonly addType = signal<'expense' | 'income'>('expense');
  protected readonly submitError = signal('');

  private readonly _addModel = signal({
    name: '',
    category: 'General' as TransactionCategory,
    amount: 0,
    date: this.todayString(),
    isRecurring: false,
  });

  protected readonly addForm = form(this._addModel, (s) => {
    required(s.name, { message: 'Transaction name is required' });
    required(s.date, { message: 'Date is required' });
    minValidator(s.amount, 0.01, { message: 'Amount must be greater than $0.00' });
  });

  protected openAddModal(): void {
    this._addModel.set({
      name: '',
      category: 'General',
      amount: 0,
      date: this.todayString(),
      isRecurring: false,
    });
    this.addType.set('expense');
    this.submitError.set('');
    this.addForm().reset();
    this.showAddModal.set(true);
  }

  protected closeAddModal(): void {
    this.showAddModal.set(false);
  }

  protected setType(t: 'expense' | 'income'): void {
    this.addType.set(t);
  }

  protected onModalCategoryChange(value: string): void {
    this._addModel.update((m) => ({ ...m, category: value as TransactionCategory }));
  }

  protected readonly modalCategory = computed(() => this._addModel().category);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.submitError.set('');
    submit(this.addForm, async () => {
      const v = this._addModel();
      const sign = this.addType() === 'income' ? 1 : -1;
      const amount = sign * Math.abs(v.amount);
      const newTx: NewTransaction = {
        name: v.name.trim(),
        avatar: '',
        category: v.category,
        amount,
        date: Timestamp.fromDate(new Date(v.date + 'T00:00:00')),
        isRecurring: v.isRecurring,
      };
      try {
        await this.txService.add(uid, newTx);
        await this.userService.adjustBalance(uid, amount);
        this.showAddModal.set(false);
      } catch {
        this.submitError.set('Failed to save transaction. Please try again.');
      }
    });
  }

  // ── Pagination helpers ───────────────────────────────────
  protected setPage(page: number | '...'): void {
    if (page === '...') return;
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected pageButtonClass(page: number | '...'): string {
    if (page === '...') return '';
    return (page) === this.currentPage()
      ? 'bg-grey-900 text-white'
      : 'text-grey-900 hover:bg-grey-100';
  }

  // ── Toolbar event handlers ───────────────────────────────
  protected onSearchInput(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  protected onSortChange(e: Event): void {
    this.sortBy.set((e.target as HTMLSelectElement).value as SortOption);
  }

  protected onCategoryChange(e: Event): void {
    this.categoryFilter.set(
      (e.target as HTMLSelectElement).value as TransactionCategory | 'All Transactions',
    );
  }

  protected onDropdownSortChange(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  protected onDropdownCategoryChange(value: string): void {
    this.categoryFilter.set(value as TransactionCategory | 'All Transactions');
  }

  // ── Display formatters ───────────────────────────────────
  protected formatDate(ts: Timestamp): string {
    return this.datePipe.transform(ts.toDate(), 'dd MMM y') ?? '';
  }

  protected formatAmount(amount: number): string {
    const abs = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `+$${abs}` : `-$${abs}`;
  }

  private categoryFromQueryParam(): TransactionCategory | 'All Transactions' {
    const param = this.route.snapshot.queryParamMap.get('category');
    const isValid = param !== null && (TRANSACTION_CATEGORIES as string[]).includes(param);
    return isValid ? (param as TransactionCategory) : 'All Transactions';
  }

  private todayString(): string {
    return this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
  }
}
