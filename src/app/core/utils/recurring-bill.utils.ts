export type BillStatus = 'paid' | 'dueSoon' | 'upcoming';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Determines the status of a recurring bill relative to today.
 * @param dueDate The resolved JS Date of the bill's due date
 * @param todayMs Midnight timestamp of today (pass `new Date(y, m, d).getTime()`)
 */
export function getBillStatus(dueDate: Date, todayMs: number): BillStatus {
  const dueDayMs = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const daysUntil = Math.round((dueDayMs - todayMs) / MS_PER_DAY);
  return daysUntil < 0 ? 'paid' : daysUntil <= 7 ? 'dueSoon' : 'upcoming';
}

/** Returns true if the given date falls in the same year/month as `now`. */
export function isCurrentMonth(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
