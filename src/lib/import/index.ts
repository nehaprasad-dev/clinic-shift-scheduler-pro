import type { PrismaClient } from "@prisma/client";
import { importStaffCsv } from "./staff";
import { importShiftsCsv } from "./shifts";
import type { ImportResult } from "./types";

export type CombinedImportResult = {
  staff: ImportResult;
  shifts: ImportResult;
};

export async function persistImportReport(
  db: PrismaClient,
  source: string,
  filename: string,
  result: ImportResult,
) {
  return db.importReport.create({
    data: {
      source,
      filename,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount,
      mergedCount: result.mergedCount,
      items: {
        create: result.items.map((item) => ({
          kind: item.kind,
          rowNumber: item.rowNumber,
          rawRow: item.rawRow,
          issue: item.issue,
          action: item.action,
        })),
      },
    },
  });
}

export async function importStaffFile(
  db: PrismaClient,
  csvContent: string,
  source: string,
  filename: string,
  passwordHash?: string,
) {
  const result = await importStaffCsv(db, csvContent, { passwordHash });
  const report = await persistImportReport(db, source, filename, result);
  return { result, report };
}

export async function importShiftsFile(
  db: PrismaClient,
  csvContent: string,
  source: string,
  filename: string,
) {
  const result = await importShiftsCsv(db, csvContent);
  const report = await persistImportReport(db, source, filename, result);
  return { result, report };
}
