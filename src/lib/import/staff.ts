import type { PrismaClient, Profession } from "@prisma/client";
import { hash } from "bcryptjs";
import { parseCsv, rowsToObjects } from "../csv";
import { normalizeEmail, normalizePersonName, normalizeProfession } from "../normalize";
import {
  emptyImportResult,
  rawRowFromRecord,
  summarize,
  type ImportResult,
} from "./types";

const DEFAULT_STAFF_PASSWORD = "staff123";

export type StaffImportOptions = {
  /** Password hash applied to newly created staff accounts */
  passwordHash?: string;
};

/**
 * Import staff rows. Duplicate legacy staff_id rows are merged (first wins).
 * Duplicate emails pointing at a different person are rejected.
 */
export async function importStaffCsv(
  db: PrismaClient,
  csvContent: string,
  options: StaffImportOptions = {},
): Promise<ImportResult> {
  const result = emptyImportResult();
  const rows = rowsToObjects(parseCsv(csvContent));
  const passwordHash =
    options.passwordHash ?? (await hash(DEFAULT_STAFF_PASSWORD, 10));

  const seenLegacyIds = new Set<number>();

  for (let index = 0; index < rows.length; index++) {
    const record = rows[index];
    const rowNumber = index + 2; // header is row 1
    const rawRow = rawRowFromRecord(record);

    const staffIdRaw = (record.staff_id ?? "").trim();
    const staffId = Number(staffIdRaw);
    if (!staffIdRaw || !Number.isInteger(staffId) || staffId <= 0) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: "Missing or invalid staff_id",
        action: "Skipped row",
      });
      continue;
    }

    if (seenLegacyIds.has(staffId)) {
      result.items.push({
        kind: "merged",
        rowNumber,
        rawRow,
        issue: `Duplicate staff_id ${staffId} in this file`,
        action: "Kept the first occurrence; ignored this duplicate",
      });
      continue;
    }

    const name = normalizePersonName(record.full_name ?? "");
    if (!name) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: "Missing full_name",
        action: "Skipped row",
      });
      continue;
    }

    const profession = normalizeProfession(record.role ?? "");
    if (!profession) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Unrecognized role "${(record.role ?? "").trim()}"`,
        action: "Skipped row",
      });
      continue;
    }

    const email = normalizeEmail(record.email ?? "");
    if (!email) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: "Missing or invalid email",
        action: "Skipped row",
      });
      continue;
    }

    const existingByLegacy = await db.user.findUnique({
      where: { legacyStaffId: staffId },
    });
    if (existingByLegacy) {
      seenLegacyIds.add(staffId);
      result.items.push({
        kind: "merged",
        rowNumber,
        rawRow,
        issue: `staff_id ${staffId} already exists in the database`,
        action: "Left existing staff record unchanged",
      });
      continue;
    }

    const existingByEmail = await db.user.findUnique({ where: { email } });
    if (existingByEmail) {
      result.items.push({
        kind: "rejected",
        rowNumber,
        rawRow,
        issue: `Email ${email} is already used by another account`,
        action: "Skipped row to avoid overwriting credentials",
      });
      continue;
    }

    await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        appRole: "STAFF",
        profession: profession as Profession,
        legacyStaffId: staffId,
      },
    });

    seenLegacyIds.add(staffId);
    result.items.push({
      kind: "accepted",
      rowNumber,
      rawRow,
      issue: "Valid staff row",
      action: "Created staff account",
    });
  }

  return summarize(result);
}
