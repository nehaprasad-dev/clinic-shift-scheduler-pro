import { addDays, startOfWeek, format } from "date-fns";

/** Monday-start week containing the given date (local interpretation of YYYY-MM-DD). */
export function weekStartFromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  return startOfWeek(local, { weekStartsOn: 1 });
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function toLocalDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Convert a YYYY-MM-DD key to a UTC midnight Date for Prisma storage. */
export function dateKeyToUtc(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function utcDateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
