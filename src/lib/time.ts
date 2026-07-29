export type Profession = "DOCTOR" | "NURSE" | "RECEPTIONIST";

export type ShiftWindow = {
  /** Absolute start as minutes since Unix epoch (UTC), derived from date + startMinutes */
  startAbs: number;
  /** Absolute end as minutes since Unix epoch (UTC) */
  endAbs: number;
};

/** Convert HH:MM to minutes from midnight. Returns null if invalid. */
export function parseClockToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Reject suffixes like "10:00+1"
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return null;

  const [hRaw, mRaw] = trimmed.split(":");
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatMinutes(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Build an absolute time window for a shift.
 * dateUtcMidnight is a Date at UTC midnight for the shift's start date.
 */
export function buildShiftWindow(
  dateUtcMidnight: Date,
  startMinutes: number,
  endMinutes: number,
  endsNextDay: boolean,
): ShiftWindow {
  const dayStart = Math.floor(dateUtcMidnight.getTime() / 60000);
  const startAbs = dayStart + startMinutes;
  const endAbs = dayStart + endMinutes + (endsNextDay ? 24 * 60 : 0);
  return { startAbs, endAbs };
}

export function rangesOverlap(a: ShiftWindow, b: ShiftWindow): boolean {
  return a.startAbs < b.endAbs && b.startAbs < a.endAbs;
}

export function resolveEndsNextDay(startMinutes: number, endMinutes: number): boolean {
  // Midnight end (00:00) always means next calendar day.
  if (endMinutes === 0) return true;
  return endMinutes <= startMinutes;
}

export function professionRequirementKey(
  profession: Profession,
): "requiredDoctors" | "requiredNurses" | "requiredReceptionists" {
  switch (profession) {
    case "DOCTOR":
      return "requiredDoctors";
    case "NURSE":
      return "requiredNurses";
    case "RECEPTIONIST":
      return "requiredReceptionists";
  }
}

export function professionLabel(profession: Profession): string {
  switch (profession) {
    case "DOCTOR":
      return "doctor";
    case "NURSE":
      return "nurse";
    case "RECEPTIONIST":
      return "receptionist";
  }
}
