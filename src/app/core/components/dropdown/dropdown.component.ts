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
  /** When provided, renders an icon-only button trigger instead of the text+caret button */
  readonly iconSrc = input<string | undefined>(undefined);
  /** Accessible label applied to both the trigger button and the listbox panel */
  readonly ariaLabel = input<string>('');

  protected readonly isOpen = signal(false);

  protected readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected select(value: string): void {
    this.valueChange.emit(value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(this.elRef.nativeElement as HTMLElement).contains(e.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}
