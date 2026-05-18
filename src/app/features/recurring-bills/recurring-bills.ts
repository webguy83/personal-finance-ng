import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { DropdownComponent } from '../../core/components/dropdown/dropdown.component';
import { RecurringBillService } from '../../core/services/recurring-bill.service';

type SortOption = 'latest' | 'oldest' | 'az' | 'za' | 'highest' | 'lowest';
type BillStatus = 'paid' | 'dueSoon' | 'upcoming';

/** View model used by the template */
interface DisplayBill {
  id: string;
  name: string;
  amount: number;
  day: number;       // day of month from dueDate
  isPaid: boolean;
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
  imports: [AvatarComponent, DropdownComponent, CurrencyPipe],
})
export class RecurringBillsComponent {
  private readonly billService = inject(RecurringBillService);

  protected readonly loading = this.billService.loading;

  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'latest', label: 'Latest'   },
    { value: 'oldest', label: 'Oldest'   },
    { value: 'az'    , label: 'A to Z'   },
    { value: 'za'    , label: 'Z to A'   },
    { value: 'highest', label: 'Highest'  },
    { value: 'lowest', label: 'Lowest'   },
  ];

  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<SortOption>('latest');

  /** All bills in the current calendar month, mapped to DisplayBill */
  private readonly allBills = computed<DisplayBill[]>(() => {
    const now = new Date();
    const today = now;
    const msPerDay = 1000 * 60 * 60 * 24;

    return this.billService.bills()
      .filter((b) => {
        const d = b.dueDate.toDate();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .map((b) => {
        const dueDate = b.dueDate.toDate();
        const day = dueDate.getDate();
        let status: BillStatus;
        if (b.isPaid) {
          status = 'paid';
        } else {
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
          status = daysUntil <= 7 ? 'dueSoon' : 'upcoming';
        }
        return { id: b.id, name: b.name, amount: b.amount, day, isPaid: b.isPaid, status };
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

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  protected openAddModal(): void {
    // TODO: implement Add Bill modal
  }
}
