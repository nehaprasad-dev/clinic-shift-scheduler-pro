import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { computeCoverage } from "@/lib/coverage";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/time";
import {
  toLocalDateKey,
  utcDateToKey,
  weekDays,
  weekStartFromDateKey,
} from "@/lib/week";

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.appRole !== "MANAGER") redirect("/shifts");

  const params = await searchParams;
  const weekParam = params.week || "2026-08-03";
  const weekStart = weekStartFromDateKey(weekParam);
  const days = weekDays(weekStart);
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = toLocalDateKey(weekStart);
  const weekEndKey = toLocalDateKey(weekEnd);
  const prevWeek = toLocalDateKey(addDays(weekStart, -7));
  const nextWeek = toLocalDateKey(addDays(weekStart, 7));

  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: new Date(`${weekStartKey}T00:00:00.000Z`),
        lte: new Date(`${weekEndKey}T00:00:00.000Z`),
      },
    },
    include: { claims: { include: { user: true } } },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  const byDay = new Map<string, typeof shifts>();
  for (const day of days) byDay.set(toLocalDateKey(day), []);
  for (const shift of shifts) {
    const key = utcDateToKey(shift.date);
    byDay.get(key)?.push(shift);
  }

  const emptyCount = shifts.filter((s) => computeCoverage(s, s.claims).status === "empty").length;
  const partialCount = shifts.filter((s) => computeCoverage(s, s.claims).status === "partial").length;
  const fullCount = shifts.filter((s) => computeCoverage(s, s.claims).status === "full").length;

  return (
    <div>
      <AppHeader user={session.user} />
      <main className="shell py-8">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">
              Week overview
            </p>
            <h1 className="page-title">Coverage</h1>
            <p className="page-sub">
              {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")} · {shifts.length} shifts ·{" "}
              {emptyCount} empty · {partialCount} partial · {fullCount} full
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/coverage?week=${prevWeek}`} className="btn-ghost">
              Previous
            </Link>
            <Link href={`/coverage?week=${nextWeek}`} className="btn-ghost">
              Next
            </Link>
            <form className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-2 py-1">
              <label className="pl-2 text-xs font-medium text-[var(--ink-soft)]" htmlFor="week">
                Jump
              </label>
              <input
                id="week"
                type="date"
                name="week"
                defaultValue={weekStartKey}
                className="border-0 bg-transparent px-1 py-1 text-sm outline-none"
              />
              <button type="submit" className="btn-primary !py-1.5">
                Go
              </button>
            </form>
          </div>
        </div>

        <section className="panel overflow-hidden rounded-2xl p-3 sm:p-4">
          <div className="week-scroll">
            {days.map((day) => {
              const key = toLocalDateKey(day);
              const dayShifts = byDay.get(key) ?? [];

              return (
                <div key={key} className="day-col">
                  <div className="day-col-head">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {format(day, "EEE")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{format(day, "d MMM")}</p>
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                      {dayShifts.length} shift{dayShifts.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="min-h-[120px] pb-1">
                    {dayShifts.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-[var(--muted)]">No shifts</p>
                    ) : (
                      dayShifts.map((shift) => {
                        const coverage = computeCoverage(shift, shift.claims);
                        return (
                          <Link
                            key={shift.id}
                            href={`/shifts/${shift.id}`}
                            className="shift-mini"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold leading-tight">
                                {formatMinutes(shift.startMinutes)}–
                                {formatMinutes(shift.endMinutes)}
                                {shift.endsNextDay ? "+" : ""}
                              </p>
                              <span className={`badge badge-${coverage.status}`}>
                                {coverage.status}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1 text-[11px] leading-snug text-[var(--ink-soft)]">
                              {coverage.required.doctors > 0 && (
                                <p>
                                  Doctors {coverage.filled.doctors}/{coverage.required.doctors}
                                </p>
                              )}
                              {coverage.required.nurses > 0 && (
                                <p>
                                  Nurses {coverage.filled.nurses}/{coverage.required.nurses}
                                </p>
                              )}
                              {coverage.required.receptionists > 0 && (
                                <p>
                                  Reception {coverage.filled.receptionists}/
                                  {coverage.required.receptionists}
                                </p>
                              )}
                            </div>

                            {coverage.missing.length > 0 ? (
                              <p className="mt-2 text-[11px] font-medium text-[var(--amber)]">
                                Need {coverage.missing.join(", ")}
                              </p>
                            ) : (
                              <p className="mt-2 text-[11px] font-medium text-[var(--ok)]">Covered</p>
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
