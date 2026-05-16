import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recurring-bills',
  template: `<h1 class="text-preset-1 text-grey-900">Recurring Bills</h1><p class="text-grey-500 mt-2">Coming soon...</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringBillsComponent {}
