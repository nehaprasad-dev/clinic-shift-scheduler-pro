/**
 * Parse clinic spreadsheet dates into a UTC midnight Date.
 * Accepts: YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY
 */
export function parseFlexibleDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  // ISO-like: 2026-08-28
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    return makeUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // European: 28/08/2026 or 5/8/2026
  const eu = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (eu) {
    return makeUtcDate(Number(eu[3]), Number(eu[2]), Number(eu[1]));
  }

  // US dashed: 08-13-2026
  const us = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(value);
  if (us) {
    return makeUtcDate(Number(us[3]), Number(us[1]), Number(us[2]));
  }

  return null;
}

function makeUtcDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject invalid calendar dates like 2026-02-30
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
