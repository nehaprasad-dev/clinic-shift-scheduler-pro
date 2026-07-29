"use server";

import { redirect } from "next/navigation";
import { AuthError, getSession, requireManager, requireUser } from "@/lib/auth";
import { ClaimError, assignStaffToShift, unassignStaffFromShift, updateShiftWithClaimRevalidation } from "@/lib/claims";
import { prisma } from "@/lib/db";
import { importStaffFile, importShiftsFile } from "@/lib/import";
import { assertCsvKind } from "@/lib/import/validate";
import { loginWithPassword, logout } from "@/lib/login";
import { parseClockToMinutes, resolveEndsNextDay } from "@/lib/time";
import { dateKeyToUtc } from "@/lib/week";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const email = formString(formData, "email");
    const password = formString(formData, "password");
    if (!email || !password) {
      return { ok: false, message: "Email and password are required." };
    }
    await loginWithPassword(email, password);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Login failed.",
    };
  }
  redirect("/shifts");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}

export async function claimShiftAction(shiftId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await assignStaffToShift({
      shiftId,
      staffUserId: user.id,
      actor: user,
    });
    return { ok: true, message: "Shift claimed." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unclaimShiftAction(shiftId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await unassignStaffFromShift({
      shiftId,
      staffUserId: user.id,
      actor: user,
    });
    return { ok: true, message: "Shift unclaimed." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function assignStaffAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const manager = await requireManager();
    const shiftId = formString(formData, "shiftId");
    const staffUserId = formString(formData, "staffUserId");
    if (!shiftId || !staffUserId) {
      return { ok: false, message: "Shift and staff member are required." };
    }
    await assignStaffToShift({
      shiftId,
      staffUserId,
      actor: manager,
    });
    return { ok: true, message: "Staff assigned." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unassignStaffAction(
  shiftId: string,
  staffUserId: string,
): Promise<ActionResult> {
  try {
    const manager = await requireManager();
    await unassignStaffFromShift({ shiftId, staffUserId, actor: manager });
    return { ok: true, message: "Staff unassigned." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createShiftAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManager();
    const parsed = parseShiftForm(formData);
    if (!parsed.ok) return parsed;

    await prisma.shift.create({ data: parsed.data });
    return { ok: true, message: "Shift created." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateShiftAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManager();
    const shiftId = formString(formData, "shiftId");
    if (!shiftId) return { ok: false, message: "Missing shift id." };

    const parsed = parseShiftForm(formData);
    if (!parsed.ok) return parsed;

    const result = await updateShiftWithClaimRevalidation({
      shiftId,
      data: parsed.data,
    });

    const extra =
      result.messages.length > 0
        ? ` ${result.messages.join(" ")}`
        : "";
    return { ok: true, message: `Shift updated.${extra}` };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteShiftAction(shiftId: string): Promise<ActionResult> {
  try {
    await requireManager();
    await prisma.shift.delete({ where: { id: shiftId } });
    return { ok: true, message: "Shift deleted." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function importCsvAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManager();
    const kind = formString(formData, "kind");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Please choose a CSV file." };
    }
    if (kind !== "staff" && kind !== "shifts") {
      return { ok: false, message: "Import kind must be staff or shifts." };
    }

    const content = await file.text();
    const headerError = assertCsvKind(content, kind);
    if (headerError) {
      return { ok: false, message: headerError };
    }

    if (kind === "staff") {
      const { result } = await importStaffFile(
        prisma,
        content,
        "upload",
        file.name || "staff.csv",
      );
      return {
        ok: true,
        message: `Staff import finished: ${result.acceptedCount} accepted, ${result.rejectedCount} rejected, ${result.mergedCount} merged. See Import report for details.`,
      };
    }

    const { result } = await importShiftsFile(
      prisma,
      content,
      "upload",
      file.name || "shifts.csv",
    );
    return {
      ok: true,
      message: `Shifts import finished: ${result.acceptedCount} accepted, ${result.rejectedCount} rejected, ${result.mergedCount} merged. See Import report for details.`,
    };
  } catch (error) {
    return toActionError(error);
  }
}

function parseShiftForm(formData: FormData):
  | {
      ok: true;
      data: {
        date: Date;
        startMinutes: number;
        endMinutes: number;
        endsNextDay: boolean;
        requiredDoctors: number;
        requiredNurses: number;
        requiredReceptionists: number;
      };
    }
  | { ok: false; message: string } {
  const dateKey = formString(formData, "date");
  const startRaw = formString(formData, "startTime");
  const endRaw = formString(formData, "endTime");
  const requiredDoctors = Number(formString(formData, "requiredDoctors") || "0");
  const requiredNurses = Number(formString(formData, "requiredNurses") || "0");
  const requiredReceptionists = Number(
    formString(formData, "requiredReceptionists") || "0",
  );

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { ok: false, message: "Date must be YYYY-MM-DD." };
  }

  const startMinutes = parseClockToMinutes(startRaw);
  const endMinutes = parseClockToMinutes(endRaw);
  if (startMinutes === null || endMinutes === null) {
    return { ok: false, message: "Start and end times must be HH:MM." };
  }

  if (
    ![requiredDoctors, requiredNurses, requiredReceptionists].every(
      (n) => Number.isInteger(n) && n >= 0,
    )
  ) {
    return { ok: false, message: "Role requirements must be non-negative integers." };
  }

  if (requiredDoctors + requiredNurses + requiredReceptionists === 0) {
    return { ok: false, message: "At least one role requirement is needed." };
  }

  const endsNextDay = resolveEndsNextDay(startMinutes, endMinutes);
  const duration = endsNextDay
    ? endMinutes + 24 * 60 - startMinutes
    : endMinutes - startMinutes;
  if (duration <= 0) {
    return { ok: false, message: "Shift must have a positive duration." };
  }

  return {
    ok: true,
    data: {
      date: dateKeyToUtc(dateKey),
      startMinutes,
      endMinutes,
      endsNextDay,
      requiredDoctors,
      requiredNurses,
      requiredReceptionists,
    },
  };
}

function toActionError(error: unknown): ActionResult {
  if (error instanceof ClaimError || error instanceof AuthError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: "Something went wrong." };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session.user ?? null;
}
