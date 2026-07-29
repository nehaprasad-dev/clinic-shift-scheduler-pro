import { parseCsv } from "../csv";

const STAFF_HEADERS = ["staff_id", "full_name", "role", "email"];
const SHIFT_HEADERS = ["shift_id", "date", "start_time", "end_time", "requirements"];

/**
 * Ensure the uploaded CSV matches the chosen import type.
 * Prevents uploading shifts.csv into the staff importer (and vice versa).
 */
export function assertCsvKind(
  content: string,
  kind: "staff" | "shifts",
): string | null {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return "CSV file is empty.";
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const required = kind === "staff" ? STAFF_HEADERS : SHIFT_HEADERS;
  const missing = required.filter((h) => !headers.includes(h));

  if (missing.length > 0) {
    const other = kind === "staff" ? "shifts" : "staff";
    const otherHeaders = kind === "staff" ? SHIFT_HEADERS : STAFF_HEADERS;
    const looksLikeOther = otherHeaders.every((h) => headers.includes(h));

    if (looksLikeOther) {
      return `This looks like a ${other} CSV. Use the ${other} upload box instead.`;
    }
    return `Missing required columns: ${missing.join(", ")}.`;
  }

  return null;
}
