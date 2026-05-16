import { Injectable, computed, signal } from '@angular/core';

/**
 * Counter-based global loading tracker.
 * Call add() before an async operation, remove() when it completes.
 * Multiple concurrent operations are handled correctly — the spinner
 * stays visible until every registered loader has finished.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _count = signal(0);

  /** True while any registered async operation is pending. */
  readonly isLoading = computed(() => this._count() > 0);

  add(): void {
    this._count.update((c) => c + 1);
  }

  remove(): void {
    this._count.update((c) => Math.max(0, c - 1));
  }
}
