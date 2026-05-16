import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
