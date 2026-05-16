import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-heading',
    'animate.enter': 'modal-in',
    'animate.leave': 'modal-out',
    '(mousedown)': 'onBackdropMousedown($event)',
    '(click)': 'onBackdropClick()',
    '(keydown.escape)': 'closed.emit()',
  },
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly maxWidth = input<string>('560px');
  readonly closed = output<void>();

  private backdropMousedownOnSelf = false;

  protected onBackdropMousedown(event: MouseEvent): void {
    this.backdropMousedownOnSelf = event.target === event.currentTarget;
  }

  protected onBackdropClick(): void {
    if (this.backdropMousedownOnSelf) this.closed.emit();
  }
}
