import type { PrismaClient } from "@prisma/client";
import { parseCsv, rowsToObjects } from "../csv";
import { parseFlexibleDate } from "../dates";
import { parseClockToMinutes, resolveEndsNextDay } from "../time";
import { parseRequirements } from "./requirements";
import {
  emptyImportResult,
  rawRowFromRecord,
  summarize,
  type ImportResult,
} from "./types";

/**
 * Import shift rows. Duplicate legacy shift_id rows are merged (first wins).
 * Overnight shifts (end <= start, or end at 00:00) are accepted as ending next day.
 */
export async function importShiftsCsv(
  db: PrismaClient,
  csvContent: string,
): Promise<ImportResult> {
  const result = emptyImportResult();
  const rows = rowsToObjects(parseCsv(csvContent));
  const seenLegacyIds = new Set<number>();

  for (let index = 0; index < rows.length; index++) {
    const record = rows[index];
    const rowNumber = index + 2;
    const rawRow = rawRowFromRecord(record);

    const shiftIdRaw = (record.shift_id ?? "").trim();
    const shiftId = Number(shiftIdRaw);
    if (!shiftIdRaw || !Number.isInteger(shiftId) || shiftId <= 0) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: "Missing or invalid shift_id",
        action: "Skipped row",
      });
      continue;
    }

    if (seenLegacyIds.has(shiftId)) {
      result.items.push({
        kind: "merged",
        rowNumber,
        rawRow,
        issue: `Duplicate shift_id ${shiftId} in this file`,
        action: "Kept the first occurrence; ignored this duplicate",
      });
      continue;
    }

    const date = parseFlexibleDate(record.date ?? "");
    if (!date) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Invalid or impossible date "${(record.date ?? "").trim()}"`,
        action: "Skipped row",
      });
      continue;
    }

    const startMinutes = parseClockToMinutes(record.start_time ?? "");
    if (startMinutes === null) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Missing or invalid start_time "${(record.start_time ?? "").trim()}"`,
        action: "Skipped row",
      });
      continue;
    }

    const endMinutes = parseClockToMinutes(record.end_time ?? "");
    if (endMinutes === null) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Missing or invalid end_time "${(record.end_time ?? "").trim()}"`,
        action: "Skipped row",
      });
      continue;
    }

    const endsNextDay = resolveEndsNextDay(startMinutes, endMinutes);
    const duration =
      endsNextDay
        ? endMinutes + 24 * 60 - startMinutes
        : endMinutes - startMinutes;

    if (duration <= 0) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: "Shift has zero or negative duration",
        action: "Skipped row",
      });
      continue;
    }

    const requirements = parseRequirements(record.requirements ?? "");
    if (!requirements) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Unparseable requirements "${(record.requirements ?? "").trim()}"`,
        action: "Skipped row",
      });
      continue;
    }

    const existing = await db.shift.findUnique({
      where: { legacyShiftId: shiftId },
    });
    if (existing) {
      seenLegacyIds.add(shiftId);
      result.items.push({
        kind: "merged",
        rowNumber,
        rawRow,
        issue: `shift_id ${shiftId} already exists in the database`,
        action: "Left existing shift unchanged",
      });
      continue;
    }

    await db.shift.create({
      data: {
        legacyShiftId: shiftId,
        date,
        startMinutes,
        endMinutes,
        endsNextDay,
        ...requirements,
      },
    });

    seenLegacyIds.add(shiftId);
    result.items.push({
      kind: "accepted",
      rowNumber,
      rawRow,
      issue: endsNextDay
        ? "Valid overnight shift (ends next calendar day)"
        : "Valid shift row",
      action: "Created shift",
    });
  }

  return summarize(result);
}
