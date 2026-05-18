import { Signal, WritableSignal, computed, linkedSignal, signal } from '@angular/core';

export interface PaginationState<T> {
  readonly currentPage: WritableSignal<number>;
  readonly totalPages: Signal<number>;
  readonly paginated: Signal<T[]>;
  readonly pageNumbers: Signal<(number | '...')[]>;
  readonly mobilePageNumbers: Signal<(number | '...')[]>;
  setPage(page: number | '...'): void;
  pageButtonClass(page: number | '...'): string;
}

/**
 * Creates a self-contained pagination state object.
 * Must be called within an Angular injection context (e.g. component field initializer).
 *
 * @param filtered  Signal of the full filtered/sorted item array to paginate
 * @param pageSize  Number of items per page
 * @param resetOn   Signals to watch — page resets to 1 whenever any of them change
 */
export function createPagination<T>(
  filtered: Signal<T[]>,
  pageSize: number,
  resetOn: Signal<unknown>[] = [],
): PaginationState<T> {
  const currentPage = resetOn.length
    ? linkedSignal(() => { resetOn.forEach((s) => s()); return 1; })
    : signal(1);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filtered().length / pageSize)),
  );

  const paginated = computed<T[]>(() => {
    const start = (currentPage() - 1) * pageSize;
    return filtered().slice(start, start + pageSize);
  });

  const pageNumbers = computed((): (number | '...')[] => {
    const total = totalPages();
    const current = currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
      pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  // Compact variant for mobile — same ±1 window, max 5 page items
  const mobilePageNumbers = computed((): (number | '...')[] => {
    const total = totalPages();
    const current = currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
      pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  function setPage(page: number | '...'): void {
    if (page === '...') return;
    currentPage.set(Math.max(1, Math.min(page, totalPages())));
  }

  function pageButtonClass(page: number | '...'): string {
    if (page === '...') return '';
    return page === currentPage() ? 'bg-grey-900 text-white' : 'text-grey-900 hover:bg-grey-100';
  }

  return { currentPage, totalPages, paginated, pageNumbers, mobilePageNumbers, setPage, pageButtonClass };
}
