import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { ClaimButton } from "@/components/ShiftActions";
import { getSession } from "@/lib/auth";
import { computeCoverage, formatRequirements } from "@/lib/coverage";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/time";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const user = session.user;
  const params = await searchParams;

  const from = params.from || "2026-08-03";
  const to = params.to || "2026-08-31";

  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T00:00:00.000Z`),
      },
    },
    include: {
      claims: { include: { user: true } },
    },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  return (
    <div>
      <AppHeader user={user} />
      <main className="shell py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">
              Schedule
            </p>
            <h1 className="page-title">Shifts</h1>
            <p className="page-sub">
              {user.appRole === "MANAGER"
                ? "Create shifts and assign staff. Seeded shifts start empty until claimed."
                : "Claim open shifts that still need your profession."}
            </p>
          </div>
          {user.appRole === "MANAGER" && (
            <Link href="/shifts/new" className="btn-primary">
              New shift
            </Link>
          )}
        </div>

        <form className="panel mb-5 flex flex-wrap items-end gap-3 rounded-2xl p-4">
          <label className="flex min-w-[150px] flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">From</span>
            <input type="date" name="from" defaultValue={from} className="field" />
          </label>
          <label className="flex min-w-[150px] flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">To</span>
            <input type="date" name="to" defaultValue={to} className="field" />
          </label>
          <button type="submit" className="btn-ghost">
            Filter
          </button>
        </form>

        <div className="space-y-2.5">
          {shifts.length === 0 && (
            <p className="panel rounded-2xl p-6 text-sm text-[var(--ink-soft)]">
              No shifts in this date range. Try August 2026.
            </p>
          )}

          {shifts.map((shift) => {
            const coverage = computeCoverage(shift, shift.claims);
            const claimedByMe = shift.claims.some((c) => c.userId === user.id);
            const endLabel = `${formatMinutes(shift.endMinutes)}${shift.endsNextDay ? " (+1)" : ""}`;

            return (
              <article key={shift.id} className="list-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/shifts/${shift.id}`}
                      className="text-[15px] font-semibold tracking-tight hover:underline"
                    >
                      {format(shift.date, "EEE d MMM yyyy")}
                    </Link>
                    <span className={`badge badge-${coverage.status}`}>{coverage.status}</span>
                  </div>

                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    <span className="font-medium text-[var(--ink)]">
                      {formatMinutes(shift.startMinutes)} – {endLabel}
                    </span>
                    <span className="mx-2 text-[var(--muted)]">·</span>
                    {formatRequirements(shift)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {coverage.required.doctors > 0 && (
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[var(--ink-soft)]">
                        Doctors {coverage.filled.doctors}/{coverage.required.doctors}
                      </span>
                    )}
                    {coverage.required.nurses > 0 && (
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[var(--ink-soft)]">
                        Nurses {coverage.filled.nurses}/{coverage.required.nurses}
                      </span>
                    )}
                    {coverage.required.receptionists > 0 && (
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[var(--ink-soft)]">
                        Reception {coverage.filled.receptionists}/
                        {coverage.required.receptionists}
                      </span>
                    )}
                  </div>

                  {coverage.missing.length > 0 ? (
                    <p className="mt-2 text-sm text-[var(--amber)]">
                      Still need: {coverage.missing.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--ok)]">Fully staffed</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user.appRole === "STAFF" && (
                    <ClaimButton shiftId={shift.id} claimed={claimedByMe} />
                  )}
                  <Link href={`/shifts/${shift.id}`} className="btn-ghost">
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
