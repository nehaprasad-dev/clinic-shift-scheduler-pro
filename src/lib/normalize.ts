import type { Profession } from "./time";

const DOCTOR_ALIASES = new Set([
  "doctor",
  "md",
  "physician",
  "doctors",
]);

const NURSE_ALIASES = new Set([
  "nurse",
  "nurses",
  "rn",
  "registered nurse",
]);

const RECEPTIONIST_ALIASES = new Set([
  "receptionist",
  "receptionists",
  "reception",
  "recep.",
  "recep",
]);

export function normalizeProfession(raw: string): Profession | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;
  if (DOCTOR_ALIASES.has(key)) return "DOCTOR";
  if (NURSE_ALIASES.has(key)) return "NURSE";
  if (RECEPTIONIST_ALIASES.has(key)) return "RECEPTIONIST";
  return null;
}

export function normalizeEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // Spreadsheet sometimes used "(at)" instead of "@"
  const withAt = trimmed.replace(/\(at\)/g, "@");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(withAt)) return null;
  return withAt;
}

export function normalizePersonName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed;
}
