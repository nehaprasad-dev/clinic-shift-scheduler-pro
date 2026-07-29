import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { assignStaffToShift, ClaimError } from "../claims";

const db = new PrismaClient();

describe("assignStaffToShift", () => {
  const ids = {
    nurseA: "",
    nurseB: "",
    shift: "",
    overlapShift: "",
  };

  beforeAll(async () => {
    const passwordHash = await hash("test", 4);
    const nurseA = await db.user.create({
      data: {
        email: `nurse-a-${Date.now()}@test.local`,
        name: "Nurse A",
        passwordHash,
        appRole: "STAFF",
        profession: "NURSE",
      },
    });
    const nurseB = await db.user.create({
      data: {
        email: `nurse-b-${Date.now()}@test.local`,
        name: "Nurse B",
        passwordHash,
        appRole: "STAFF",
        profession: "NURSE",
      },
    });
    const shift = await db.shift.create({
      data: {
        date: new Date(Date.UTC(2030, 0, 2)),
        startMinutes: 9 * 60,
        endMinutes: 17 * 60,
        endsNextDay: false,
        requiredNurses: 1,
        requiredDoctors: 0,
        requiredReceptionists: 0,
      },
    });
    const overlapShift = await db.shift.create({
      data: {
        date: new Date(Date.UTC(2030, 0, 2)),
        startMinutes: 12 * 60,
        endMinutes: 20 * 60,
        endsNextDay: false,
        requiredNurses: 1,
        requiredDoctors: 0,
        requiredReceptionists: 0,
      },
    });
    ids.nurseA = nurseA.id;
    ids.nurseB = nurseB.id;
    ids.shift = shift.id;
    ids.overlapShift = overlapShift.id;
  });

  afterAll(async () => {
    await db.claim.deleteMany({
      where: { shiftId: { in: [ids.shift, ids.overlapShift] } },
    });
    await db.shift.deleteMany({
      where: { id: { in: [ids.shift, ids.overlapShift] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [ids.nurseA, ids.nurseB] } },
    });
    await db.$disconnect();
  });

  it("rejects a second nurse when capacity is full", async () => {
    await assignStaffToShift({
      shiftId: ids.shift,
      staffUserId: ids.nurseA,
      actor: { id: ids.nurseA, appRole: "STAFF" },
    });

    await expect(
      assignStaffToShift({
        shiftId: ids.shift,
        staffUserId: ids.nurseB,
        actor: { id: ids.nurseB, appRole: "STAFF" },
      }),
    ).rejects.toBeInstanceOf(ClaimError);
  });

  it("rejects overlapping claims for the same person", async () => {
    await expect(
      assignStaffToShift({
        shiftId: ids.overlapShift,
        staffUserId: ids.nurseA,
        actor: { id: "manager", appRole: "MANAGER" },
      }),
    ).rejects.toBeInstanceOf(ClaimError);
  });
});
