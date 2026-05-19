import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'animate.enter': 'modal-in',
    'animate.leave': 'modal-out',
    '(mousedown)': 'onBackdropMousedown($event)',
    '(click)': 'onBackdropClick()',
    '(keydown.escape)': 'closed.emit()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');

  readonly title = input.required<string>();
  readonly maxWidth = input<string>('560px');
  readonly closed = output<void>();

  private backdropMousedownOnSelf = false;
  private previousFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.panelRef().nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(this.panelRef().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const els = this.focusableElements();
    if (!els.length) return;
    const panel = this.panelRef().nativeElement;
    const first = els[0];
    const last = els[els.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || document.activeElement === panel) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  protected onBackdropMousedown(event: MouseEvent): void {
    this.backdropMousedownOnSelf = event.target === event.currentTarget;
  }

  protected onBackdropClick(): void {
    if (this.backdropMousedownOnSelf) this.closed.emit();
  }
}
