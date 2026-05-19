import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  secondaryLabel?: string;
  disabled?: boolean;
}

let _dropdownIdCounter = 0;

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
})
export class DropdownComponent {
  private readonly elRef = inject(ElementRef);

  protected readonly triggerId = `app-dropdown-trigger-${++_dropdownIdCounter}`;

  readonly options = input.required<DropdownOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
  readonly iconSrc = input<string | undefined>(undefined);
  readonly ariaLabel = input<string>('');
  readonly labelId = input<string | undefined>(undefined);

  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(0);

  protected readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  protected readonly selectedOption = computed(
    () => this.options().find((o) => o.value === this.value()),
  );

  protected toggle(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.focusTrigger();
    } else {
      const idx = this.options().findIndex((o) => o.value === this.value() && !o.disabled);
      this.activeIndex.set(idx >= 0 ? idx : this.firstEnabledIndex());
      this.isOpen.set(true);
      setTimeout(() => this.focusOption(this.activeIndex()));
    }
  }

  protected select(value: string): void {
    if (this.options().find((o) => o.value === value)?.disabled) return;
    this.valueChange.emit(value);
    this.isOpen.set(false);
    this.focusTrigger();
  }

  protected onOptionKeydown(event: KeyboardEvent, index: number): void {
    const opts = this.options();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = this.nextEnabledIndex(index);
        this.activeIndex.set(next);
        this.focusOption(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = this.prevEnabledIndex(index);
        this.activeIndex.set(prev);
        this.focusOption(prev);
        break;
      }
      case 'Home': {
        event.preventDefault();
        const first = this.firstEnabledIndex();
        this.activeIndex.set(first);
        this.focusOption(first);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = this.lastEnabledIndex();
        this.activeIndex.set(last);
        this.focusOption(last);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const opt = opts[index];
        if (opt && !opt.disabled) this.select(opt.value);
        break;
      }
      case 'Tab': {
        // Close on Tab without stealing focus — let Tab propagate naturally
        this.isOpen.set(false);
        break;
      }
    }
  }

  private firstEnabledIndex(): number {
    const idx = this.options().findIndex((o) => !o.disabled);
    return idx >= 0 ? idx : 0;
  }

  private lastEnabledIndex(): number {
    const opts = this.options();
    for (let i = opts.length - 1; i >= 0; i--) {
      if (!opts[i].disabled) return i;
    }
    return 0;
  }

  private nextEnabledIndex(from: number): number {
    const opts = this.options();
    for (let i = from + 1; i < opts.length; i++) {
      if (!opts[i].disabled) return i;
    }
    return from;
  }

  private prevEnabledIndex(from: number): number {
    const opts = this.options();
    for (let i = from - 1; i >= 0; i--) {
      if (!opts[i].disabled) return i;
    }
    return from;
  }

  private focusOption(index: number): void {
    const options = (this.elRef.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]');
    options[index]?.focus();
  }

  private focusTrigger(): void {
    (this.elRef.nativeElement as HTMLElement)
      .querySelector<HTMLElement>(`#${this.triggerId}`)
      ?.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(this.elRef.nativeElement as HTMLElement).contains(e.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.focusTrigger();
    }
  }
}
