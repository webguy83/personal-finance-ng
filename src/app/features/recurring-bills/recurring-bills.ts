import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { form, FormField, submit, required, min as minValidator } from '@angular/forms/signals';
import { Timestamp } from 'firebase/firestore';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DropdownComponent, DropdownOption } from '../../core/components/dropdown/dropdown.component';
import { ModalComponent } from '../../core/components/modal/modal.component';
import { AuthService } from '../../core/services/auth.service';
import { RecurringBillService } from '../../core/services/recurring-bill.service';
import { NewRecurringBill } from '../../core/models/recurring-bill.model';
import { createPagination } from '../../core/utils/pagination';

type SortOption = 'latest' | 'oldest' | 'az' | 'za' | 'highest' | 'lowest';
type BillStatus = 'paid' | 'dueSoon' | 'upcoming';

/** View model used by the template */
interface DisplayBill {
  id: string;
  name: string;
  amount: number;
  day: number;       // day of month from dueDate
  status: BillStatus;
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

@Component({
  selector: 'app-recurring-bills',
  templateUrl: './recurring-bills.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, DropdownComponent, CurrencyPipe, FormField, ModalComponent],
  providers: [DatePipe],
})
export class RecurringBillsComponent {
  private readonly billService = inject(RecurringBillService);
  private readonly authService = inject(AuthService);
  private readonly datePipe = inject(DatePipe);

  protected readonly loading = this.billService.loading;

  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'latest', label: 'Latest'   },
    { value: 'oldest', label: 'Oldest'   },
    { value: 'az'    , label: 'A to Z'   },
    { value: 'za'    , label: 'Z to A'   },
    { value: 'highest', label: 'Highest'  },
    { value: 'lowest', label: 'Lowest'   },
  ];

  protected readonly billCategoryOptions: DropdownOption[] = [
    { value: 'Bills',           label: 'Bills'           },
    { value: 'Subscriptions',   label: 'Subscriptions'   },
    { value: 'Utilities',       label: 'Utilities'       },
    { value: 'Housing',         label: 'Housing'         },
    { value: 'Insurance',       label: 'Insurance'       },
    { value: 'Transportation',  label: 'Transportation'  },
    { value: 'Personal Care',   label: 'Personal Care'   },
  ];

  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<SortOption>('latest');

  /** All bills in the current calendar month, mapped to DisplayBill */
  private readonly allBills = computed<DisplayBill[]>(() => {
    const now = new Date();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msPerDay = 1000 * 60 * 60 * 24;

    return this.billService.bills()
      .filter((b) => {
        const d = b.dueDate.toDate();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .map((b) => {
        const dueDate = b.dueDate.toDate();
        const day = dueDate.getDate();
        const dueDayMs = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
        const daysUntil = Math.round((dueDayMs - todayMs) / msPerDay);
        const status: BillStatus = daysUntil < 0 ? 'paid' : daysUntil <= 7 ? 'dueSoon' : 'upcoming';
        return { id: b.id, name: b.name, amount: b.amount, day, status };
      });
  });

  protected readonly filteredBills = computed(() => {
    let bills = this.allBills();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) bills = bills.filter((b) => b.name.toLowerCase().includes(q));

    switch (this.sortBy()) {
      case 'oldest':  return [...bills].sort((a, b) => b.day - a.day);
      case 'az':      return [...bills].sort((a, b) => a.name.localeCompare(b.name));
      case 'za':      return [...bills].sort((a, b) => b.name.localeCompare(a.name));
      case 'highest': return [...bills].sort((a, b) => b.amount - a.amount);
      case 'lowest':  return [...bills].sort((a, b) => a.amount - b.amount);
      default:        return [...bills].sort((a, b) => a.day - b.day); // 'latest' = by date asc
    }
  });

  protected readonly totalBills    = computed(() => this.allBills().reduce((s, b) => s + b.amount, 0));
  protected readonly paidBills     = computed(() => this.allBills().filter((b) => b.status === 'paid'));
  protected readonly upcomingBills = computed(() => this.allBills().filter((b) => b.status !== 'paid'));
  protected readonly dueSoonBills  = computed(() => this.allBills().filter((b) => b.status === 'dueSoon'));
  protected readonly paidTotal     = computed(() => this.paidBills().reduce((s, b) => s + b.amount, 0));
  protected readonly upcomingTotal = computed(() => this.upcomingBills().reduce((s, b) => s + b.amount, 0));
  protected readonly dueSoonTotal  = computed(() => this.dueSoonBills().reduce((s, b) => s + b.amount, 0));

  protected readonly ordinal = ordinal;

  protected readonly pagination = createPagination(
    this.filteredBills,
    10,
    [this.searchQuery, this.sortBy],
  );

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  // ── Add Bill modal ────────────────────────────────────────
  protected readonly showAddModal = signal(false);
  protected readonly submitError = signal('');

  private readonly _addModel = signal({
    name: '',
    amount: 0,
    dueDate: this.todayString(),
    category: 'Bills',
  });

  protected readonly addForm = form(this._addModel, (s) => {
    required(s.name, { message: 'Bill name is required' });
    required(s.dueDate, { message: 'Due date is required' });
    minValidator(s.amount, 0.01, { message: 'Amount must be greater than $0.00' });
  });

  protected readonly modalCategory = computed(() => this._addModel().category);

  protected onModalCategoryChange(value: string): void {
    this._addModel.update((m) => ({ ...m, category: value }));
  }

  protected openAddModal(): void {
    this._addModel.set({ name: '', amount: 0, dueDate: this.todayString(), category: 'Bills' });
    this.submitError.set('');
    this.addForm().reset();
    this.showAddModal.set(true);
  }

  protected closeAddModal(): void {
    this.showAddModal.set(false);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.submitError.set('');
    submit(this.addForm, async () => {
      const v = this._addModel();
      const newBill: NewRecurringBill = {
        name: v.name.trim(),
        amount: Math.abs(v.amount),
        dueDate: Timestamp.fromDate(new Date(v.dueDate + 'T00:00:00')),
        category: v.category,
      };
      try {
        await this.billService.add(uid, newBill);
        this.showAddModal.set(false);
      } catch {
        this.submitError.set('Failed to save bill. Please try again.');
      }
    });
  }

  private todayString(): string {
    return this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
  }
}
