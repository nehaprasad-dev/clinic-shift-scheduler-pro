import type { Profession, Shift } from "@prisma/client";
import { professionLabel } from "./time";

export type StaffingStatus = "empty" | "partial" | "full";

export type CoverageInfo = {
  status: StaffingStatus;
  missing: string[];
  filled: {
    doctors: number;
    nurses: number;
    receptionists: number;
  };
  required: {
    doctors: number;
    nurses: number;
    receptionists: number;
  };
};

export function computeCoverage(
  shift: Pick<
    Shift,
    "requiredDoctors" | "requiredNurses" | "requiredReceptionists"
  >,
  claims: { user: { profession: Profession | null } }[],
): CoverageInfo {
  const filled = { doctors: 0, nurses: 0, receptionists: 0 };
  for (const claim of claims) {
    if (claim.user.profession === "DOCTOR") filled.doctors++;
    if (claim.user.profession === "NURSE") filled.nurses++;
    if (claim.user.profession === "RECEPTIONIST") filled.receptionists++;
  }

  const required = {
    doctors: shift.requiredDoctors,
    nurses: shift.requiredNurses,
    receptionists: shift.requiredReceptionists,
  };

  const missing: string[] = [];
  const need = (count: number, profession: Profession) => {
    if (count > 0) {
      missing.push(`${count} ${professionLabel(profession)}${count === 1 ? "" : "s"}`);
    }
  };

  need(Math.max(0, required.doctors - filled.doctors), "DOCTOR");
  need(Math.max(0, required.nurses - filled.nurses), "NURSE");
  need(Math.max(0, required.receptionists - filled.receptionists), "RECEPTIONIST");

  const totalRequired =
    required.doctors + required.nurses + required.receptionists;
  const totalFilled = filled.doctors + filled.nurses + filled.receptionists;

  let status: StaffingStatus = "partial";
  if (totalFilled === 0) status = "empty";
  else if (missing.length === 0) status = "full";
  else status = "partial";

  // Guard: over-filled still counts as full if nothing missing
  if (missing.length === 0 && totalRequired > 0) status = "full";
  if (totalFilled === 0) status = "empty";

  return { status, missing, filled, required };
}

export function formatRequirements(shift: {
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
}): string {
  const parts: string[] = [];
  if (shift.requiredDoctors > 0) {
    parts.push(
      `${shift.requiredDoctors} doctor${shift.requiredDoctors === 1 ? "" : "s"}`,
    );
  }
  if (shift.requiredNurses > 0) {
    parts.push(
      `${shift.requiredNurses} nurse${shift.requiredNurses === 1 ? "" : "s"}`,
    );
  }
  if (shift.requiredReceptionists > 0) {
    parts.push(
      `${shift.requiredReceptionists} receptionist${shift.requiredReceptionists === 1 ? "" : "s"}`,
    );
  }
  return parts.join(" + ") || "No roles required";
}
