import { describe, expect, it } from "vitest";
import { parseFlexibleDate } from "../dates";
import { normalizeEmail, normalizeProfession } from "../normalize";
import { parseRequirements } from "../import/requirements";
import {
  buildShiftWindow,
  parseClockToMinutes,
  rangesOverlap,
  resolveEndsNextDay,
} from "../time";
import { parseCsv } from "../csv";

describe("normalizeProfession", () => {
  it("maps spreadsheet aliases", () => {
    expect(normalizeProfession("RN")).toBe("NURSE");
    expect(normalizeProfession("Physician")).toBe("DOCTOR");
    expect(normalizeProfession("recep.")).toBe("RECEPTIONIST");
    expect(normalizeProfession("Janitor")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("fixes (at) and rejects blanks", () => {
    expect(normalizeEmail("priya.weber(at)clinicmail.test")).toBe(
      "priya.weber@clinicmail.test",
    );
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("parseFlexibleDate", () => {
  it("accepts several formats and rejects impossible dates", () => {
    expect(parseFlexibleDate("2026-08-28")?.toISOString().slice(0, 10)).toBe("2026-08-28");
    expect(parseFlexibleDate("05/08/2026")?.toISOString().slice(0, 10)).toBe("2026-08-05");
    expect(parseFlexibleDate("08-13-2026")?.toISOString().slice(0, 10)).toBe("2026-08-13");
    expect(parseFlexibleDate("2026-02-30")).toBeNull();
  });
});

describe("parseRequirements", () => {
  it("parses key=value lists and rejects prose", () => {
    expect(parseRequirements("nurses=2;doctors=1;receptionists=0")).toEqual({
      requiredDoctors: 1,
      requiredNurses: 2,
      requiredReceptionists: 0,
    });
    expect(parseRequirements("two nurses and a doctor")).toBeNull();
  });
});

describe("time windows", () => {
  it("detects overnight and overlap", () => {
    expect(parseClockToMinutes("10:00+1")).toBeNull();
    expect(resolveEndsNextDay(22 * 60, 6 * 60)).toBe(true);
    expect(resolveEndsNextDay(9 * 60, 17 * 60)).toBe(false);

    const day = new Date(Date.UTC(2026, 7, 8));
    const a = buildShiftWindow(day, 8 * 60, 16 * 60, false);
    const b = buildShiftWindow(day, 14 * 60, 22 * 60, false);
    const c = buildShiftWindow(day, 16 * 60, 0, true);
    expect(rangesOverlap(a, b)).toBe(true);
    expect(rangesOverlap(a, c)).toBe(false);
  });
});

describe("parseCsv", () => {
  it("splits simple rows", () => {
    const rows = parseCsv("a,b\n1,2\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
