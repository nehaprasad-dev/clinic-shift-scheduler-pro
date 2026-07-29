import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ClaimButton } from "@/components/ShiftActions";
import { getSession } from "@/lib/auth";
import { computeCoverage, formatRequirements } from "@/lib/coverage";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/time";
import { utcDateToKey } from "@/lib/week";

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
          <div className="rise">
            <h1
              className="text-3xl font-semibold text-[var(--teal-deep)]"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Shifts
            </h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              {user.appRole === "MANAGER"
                ? "Create shifts and assign staff directly."
                : "Claim open shifts that match your profession."}
            </p>
          </div>
          {user.appRole === "MANAGER" && (
            <Link
              href="/shifts/new"
              className="rounded-md bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--teal-deep)]"
            >
              New shift
            </Link>
          )}
        </div>

        <form className="panel rise rise-delay-1 mb-6 flex flex-wrap items-end gap-3 rounded-xl p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">From</span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">To</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--paper-2)]"
          >
            Filter
          </button>
        </form>

        <div className="rise rise-delay-2 space-y-3">
          {shifts.length === 0 && (
            <p className="panel rounded-xl p-6 text-[var(--ink-soft)]">
              No shifts in this date range.
            </p>
          )}

          {shifts.map((shift) => {
            const coverage = computeCoverage(shift, shift.claims);
            const claimedByMe = shift.claims.some((c) => c.userId === user.id);
            const endLabel = `${formatMinutes(shift.endMinutes)}${shift.endsNextDay ? " (+1)" : ""}`;

            return (
              <article
                key={shift.id}
                className="panel grid gap-4 rounded-xl p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/shifts/${shift.id}`}
                      className="text-lg font-semibold hover:text-[var(--teal)]"
                      style={{ fontFamily: "var(--font-display), serif" }}
                    >
                      {utcDateToKey(shift.date)}
                    </Link>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide status-${coverage.status}`}
                    >
                      {coverage.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {formatMinutes(shift.startMinutes)} – {endLabel} · {formatRequirements(shift)}
                  </p>
                  {coverage.missing.length > 0 ? (
                    <p className="mt-1 text-sm text-[var(--amber)]">
                      Missing: {coverage.missing.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--ok)]">Fully staffed</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user.appRole === "STAFF" && (
                    <ClaimButton shiftId={shift.id} claimed={claimedByMe} />
                  )}
                  <Link
                    href={`/shifts/${shift.id}`}
                    className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold hover:bg-[var(--paper-2)]"
                  >
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
