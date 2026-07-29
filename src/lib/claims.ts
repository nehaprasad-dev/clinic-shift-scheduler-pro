import type { Profession, Prisma, Shift, User } from "@prisma/client";
import { prisma } from "./db";
import {
  buildShiftWindow,
  professionLabel,
  professionRequirementKey,
  rangesOverlap,
  type ShiftWindow,
} from "./time";

export class ClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimError";
  }
}

type ShiftLike = Pick<
  Shift,
  | "id"
  | "date"
  | "startMinutes"
  | "endMinutes"
  | "endsNextDay"
  | "requiredDoctors"
  | "requiredNurses"
  | "requiredReceptionists"
>;

type Tx = Prisma.TransactionClient;

function windowFor(shift: ShiftLike): ShiftWindow {
  return buildShiftWindow(
    shift.date,
    shift.startMinutes,
    shift.endMinutes,
    shift.endsNextDay,
  );
}

async function countProfessionClaims(
  tx: Tx,
  shiftId: string,
  profession: Profession,
): Promise<number> {
  return tx.claim.count({
    where: {
      shiftId,
      user: { profession },
    },
  });
}

async function findOverlappingClaim(
  tx: Tx,
  userId: string,
  candidate: ShiftLike,
  excludeShiftId?: string,
) {
  const candidateWindow = windowFor(candidate);
  const claims = await tx.claim.findMany({
    where: {
      userId,
      ...(excludeShiftId ? { shiftId: { not: excludeShiftId } } : {}),
    },
    include: { shift: true },
  });

  for (const claim of claims) {
    if (rangesOverlap(candidateWindow, windowFor(claim.shift))) {
      return claim;
    }
  }
  return null;
}

/**
 * Assign a staff member to a shift.
 * Runs inside a serializable-style interactive transaction so concurrent
 * claims cannot both succeed when only one slot remains.
 */
export async function assignStaffToShift(params: {
  shiftId: string;
  staffUserId: string;
  actor: Pick<User, "id" | "appRole">;
}): Promise<void> {
  const { shiftId, staffUserId, actor } = params;

  if (actor.appRole === "STAFF" && actor.id !== staffUserId) {
    throw new ClaimError("Staff can only claim shifts for themselves.");
  }

  await prisma.$transaction(async (tx) => {
    // Lock the shift row by reading it first inside the transaction.
    // SQLite serializes write transactions; Postgres would use FOR UPDATE.
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      throw new ClaimError("Shift not found.");
    }

    const staff = await tx.user.findUnique({ where: { id: staffUserId } });
    if (!staff || staff.appRole !== "STAFF" || !staff.profession) {
      throw new ClaimError("Target user is not a staff member.");
    }

    const existing = await tx.claim.findUnique({
      where: { shiftId_userId: { shiftId, userId: staffUserId } },
    });
    if (existing) {
      throw new ClaimError("This staff member is already assigned to that shift.");
    }

    const requirementKey = professionRequirementKey(staff.profession);
    const required = shift[requirementKey];
    if (required <= 0) {
      throw new ClaimError(
        `This shift does not need any ${professionLabel(staff.profession)}s.`,
      );
    }

    const currentCount = await countProfessionClaims(tx, shiftId, staff.profession);
    if (currentCount >= required) {
      throw new ClaimError(
        `This shift already has enough ${professionLabel(staff.profession)}s (${required} required).`,
      );
    }

    const overlap = await findOverlappingClaim(tx, staffUserId, shift);
    if (overlap) {
      throw new ClaimError(
        `This assignment overlaps another claimed shift starting at ${overlap.shift.date.toISOString().slice(0, 10)}.`,
      );
    }

    await tx.claim.create({
      data: { shiftId, userId: staffUserId },
    });

    // Re-check after insert so two concurrent claims cannot both fill the last slot.
    const afterCount = await countProfessionClaims(tx, shiftId, staff.profession);
    if (afterCount > required) {
      throw new ClaimError(
        `This shift already has enough ${professionLabel(staff.profession)}s (${required} required).`,
      );
    }
  });
}

export async function unassignStaffFromShift(params: {
  shiftId: string;
  staffUserId: string;
  actor: Pick<User, "id" | "appRole">;
}): Promise<void> {
  const { shiftId, staffUserId, actor } = params;

  if (actor.appRole === "STAFF" && actor.id !== staffUserId) {
    throw new ClaimError("Staff can only unclaim their own shifts.");
  }

  const deleted = await prisma.claim.deleteMany({
    where: { shiftId, userId: staffUserId },
  });

  if (deleted.count === 0) {
    throw new ClaimError("No matching claim found to remove.");
  }
}

export type ShiftEditInput = {
  date: Date;
  startMinutes: number;
  endMinutes: number;
  endsNextDay: boolean;
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
};

/**
 * Update a shift. Claims that become invalid under the new times or reduced
 * role requirements are removed automatically. Returns who was unclaimed.
 */
export async function updateShiftWithClaimRevalidation(params: {
  shiftId: string;
  data: ShiftEditInput;
}): Promise<{ removedClaimUserIds: string[]; messages: string[] }> {
  const { shiftId, data } = params;
  const removedClaimUserIds: string[] = [];
  const messages: string[] = [];

  await prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
      include: { claims: { include: { user: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!shift) {
      throw new ClaimError("Shift not found.");
    }

    const duration = data.endsNextDay
      ? data.endMinutes + 24 * 60 - data.startMinutes
      : data.endMinutes - data.startMinutes;
    if (duration <= 0) {
      throw new ClaimError("Shift end must be after start.");
    }

    await tx.shift.update({
      where: { id: shiftId },
      data,
    });

    const updated: ShiftLike = { id: shiftId, ...data };

    // Drop claims that now overlap another shift for the same person.
    for (const claim of shift.claims) {
      const overlap = await findOverlappingClaim(
        tx,
        claim.userId,
        updated,
        shiftId,
      );
      if (overlap) {
        await tx.claim.delete({ where: { id: claim.id } });
        removedClaimUserIds.push(claim.userId);
        messages.push(
          `Removed ${claim.user.name}: new times overlap another claimed shift.`,
        );
      }
    }

    // Re-read remaining claims after overlap removals.
    const remaining = await tx.claim.findMany({
      where: { shiftId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    const byProfession: Record<Profession, typeof remaining> = {
      DOCTOR: [],
      NURSE: [],
      RECEPTIONIST: [],
    };
    for (const claim of remaining) {
      if (claim.user.profession) {
        byProfession[claim.user.profession].push(claim);
      }
    }

    const caps: Record<Profession, number> = {
      DOCTOR: data.requiredDoctors,
      NURSE: data.requiredNurses,
      RECEPTIONIST: data.requiredReceptionists,
    };

    for (const profession of Object.keys(caps) as Profession[]) {
      const list = byProfession[profession];
      const cap = caps[profession];
      if (list.length <= cap) continue;

      // Keep earliest claimants; remove surplus newest first.
      const surplus = list.slice(cap);
      for (const claim of surplus) {
        await tx.claim.delete({ where: { id: claim.id } });
        removedClaimUserIds.push(claim.userId);
        messages.push(
          `Removed ${claim.user.name}: ${professionLabel(profession)} capacity reduced to ${cap}.`,
        );
      }
    }
  });

  return { removedClaimUserIds, messages };
}
