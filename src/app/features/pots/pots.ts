import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { form, FormField, submit, required, min as minValidator, max as maxValidator, maxLength as maxLengthValidator } from '@angular/forms/signals';

import { DropdownComponent, DropdownOption } from '../../core/components/dropdown/dropdown.component';
import { ModalComponent } from '../../core/components/modal/modal.component';
import { PotService } from '../../core/services/pot.service';
import { AuthService } from '../../core/services/auth.service';
import { Pot } from '../../core/models/pot.model';
import { THEME_COLORS } from '../../core/constants/theme-colors';

type PotFormModel = {
  name: string;
  target: number | null;
  theme: string;
};

type AdjustFormModel = {
  amount: number | null;
};

@Component({
  selector: 'app-pots',
  templateUrl: './pots.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, FormField, DropdownComponent, ModalComponent],
  providers: [CurrencyPipe],
})
export class PotsComponent {
  private readonly potService = inject(PotService);
  private readonly authService = inject(AuthService);

  protected readonly loading = this.potService.loading;
  protected readonly pots = this.potService.pots;

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
  protected readonly editingPot = signal<Pot | null>(null);
  protected readonly submitError = signal('');

  private readonly _formModel = signal<PotFormModel>({
    name: '',
    target: null,
    theme: THEME_COLORS[0].value,
  });

  protected readonly potForm = form(this._formModel, (s) => {
    required(s.name, { message: 'Pot name is required' });
    maxLengthValidator(s.name, 30, { message: 'Pot name must be 30 characters or fewer' });
    required(s.target, { message: 'Target is required' });
    minValidator(s.target, 0.01, { message: 'Target must be greater than $0.00' });
  });

  protected readonly formName = computed(() => this._formModel().name);
  protected readonly formTheme = computed(() => this._formModel().theme);

  protected readonly themeColorOptions = computed((): DropdownOption[] => {
    const editing = this.editingPot();
    const usedThemes = new Set(
      this.potService.pots()
        .filter((p) => p.id !== editing?.id)
        .map((p) => p.theme),
    );
    return THEME_COLORS.map((c) => ({
      value: c.value,
      label: c.label,
      color: c.value,
      ...(usedThemes.has(c.value) ? { secondaryLabel: 'Already used', disabled: true } : {}),
    }));
  });

  protected readonly canAddPot = computed(() =>
    this.themeColorOptions().some((o) => !o.disabled),
  );

  protected onThemeChange(color: string): void {
    this._formModel.update((m) => ({ ...m, theme: color }));
  }

  protected openAddModal(): void {
    const firstTheme = this.themeColorOptions().find((o) => !o.secondaryLabel)?.value ?? THEME_COLORS[0].value;
    this._formModel.set({ name: '', target: null, theme: firstTheme });
    this.editingPot.set(null);
    this.submitError.set('');
    this.potForm().reset();
    this.showModal.set(true);
  }

  protected openEditModal(pot: Pot): void {
    this.editingPot.set(pot);
    this._formModel.set({ name: pot.name, target: pot.target, theme: pot.theme });
    this.submitError.set('');
    this.openMenuId.set(null);
    this.potForm().reset();
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
    submit(this.potForm, async () => {
      const { name, target, theme } = this._formModel();
      const editing = this.editingPot();
      try {
        if (editing) {
          await this.potService.update(uid, editing.id, { name, target: Number(target), theme });
        } else {
          await this.potService.add(uid, { name, target: Number(target), theme, total: 0 });
        }
        this.closeModal();
      } catch {
        this.submitError.set('Failed to save pot. Please try again.');
      }
    });
  }

  // ── Delete confirm ───────────────────────────────────────────────────────────
  protected readonly deletingPot = signal<Pot | null>(null);

  protected openDeleteConfirm(pot: Pot): void {
    this.deletingPot.set(pot);
    this.openMenuId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    const pot = this.deletingPot();
    if (!uid || !pot) return;
    await this.potService.remove(uid, pot.id, pot.total);
    this.deletingPot.set(null);
  }

  protected cancelDelete(): void {
    this.deletingPot.set(null);
  }

  // ── Adjust (Add Money / Withdraw) ────────────────────────────────────────────
  protected readonly adjustingPot = signal<Pot | null>(null);
  protected readonly adjustMode = signal<'add' | 'withdraw'>('add');
  protected readonly adjustError = signal('');

  private readonly _adjustModel = signal<AdjustFormModel>({ amount: null });

  protected readonly adjustForm = form(this._adjustModel, (s) => {
    required(s.amount, { message: 'Amount is required' });
    minValidator(s.amount, 0.01, { message: 'Amount must be greater than $0.00' });
    maxValidator(
      s.amount,
      () => {
        const pot = this.adjustingPot();
        if (!pot) return Infinity;
        return this.adjustMode() === 'add' ? pot.target - pot.total : pot.total;
      },
      {
        message: () => {
          const pot = this.adjustingPot();
          if (!pot) return 'Invalid amount';
          if (this.adjustMode() === 'add') {
            const remaining = pot.target - pot.total;
            return `Cannot add more than the remaining $${remaining.toFixed(2)} to reach the target`;
          }
          return `Cannot withdraw more than the saved amount of $${pot.total.toFixed(2)}`;
        },
      },
    );
  });

  protected readonly newTotal = computed(() => {
    const pot = this.adjustingPot();
    const amount = this._adjustModel().amount;
    if (!pot) return 0;
    if (amount === null || amount === undefined) return pot.total;
    const delta = this.adjustMode() === 'add' ? Number(amount) : -Number(amount);
    return pot.total + delta;
  });

  protected readonly currentProgressPct = computed(() => {
    const pot = this.adjustingPot();
    if (!pot || pot.target === 0) return 0;
    return Math.min(100, (pot.total / pot.target) * 100);
  });

  protected readonly newProgressPct = computed(() => {
    const pot = this.adjustingPot();
    if (!pot || pot.target === 0) return 0;
    return Math.min(100, Math.max(0, (this.newTotal() / pot.target) * 100));
  });

  protected readonly adjustDeltaPct = computed(() => {
    return Math.abs(this.newProgressPct() - this.currentProgressPct());
  });

  protected openAddMoney(pot: Pot): void {
    this.adjustingPot.set(pot);
    this.adjustMode.set('add');
    this._adjustModel.set({ amount: null });
    this.adjustError.set('');
    this.adjustForm().reset();
  }

  protected openWithdraw(pot: Pot): void {
    this.adjustingPot.set(pot);
    this.adjustMode.set('withdraw');
    this._adjustModel.set({ amount: null });
    this.adjustError.set('');
    this.adjustForm().reset();
  }

  protected cancelAdjust(): void {
    this.adjustingPot.set(null);
  }

  protected onAdjustSubmit(e: Event): void {
    e.preventDefault();
    const uid = this.authService.currentUser()?.uid;
    const pot = this.adjustingPot();
    if (!uid || !pot) return;
    this.adjustError.set('');
    submit(this.adjustForm, async () => {
      const { amount } = this._adjustModel();
      const delta = this.adjustMode() === 'add' ? Number(amount) : -Number(amount);
      try {
        await this.potService.adjustTotal(uid, pot.id, delta);
        this.cancelAdjust();
      } catch {
        this.adjustError.set('Failed to update pot. Please try again.');
      }
    });
  }

  // ── Progress helper ──────────────────────────────────────────────────────────
  protected progressPct(pot: Pot): number {
    if (pot.target === 0) return 0;
    return Math.min(100, (pot.total / pot.target) * 100);
  }
}
