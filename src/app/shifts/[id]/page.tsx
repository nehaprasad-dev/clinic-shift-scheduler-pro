import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AssignStaffForm, ShiftForm, shiftToFormValues } from "@/components/ShiftForms";
import { ClaimButton, DeleteShiftButton, UnassignButton } from "@/components/ShiftActions";
import { getSession } from "@/lib/auth";
import { computeCoverage, formatRequirements } from "@/lib/coverage";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/time";
import { utcDateToKey } from "@/lib/week";

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const user = session.user;
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      claims: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!shift) notFound();

  const coverage = computeCoverage(shift, shift.claims);
  const claimedByMe = shift.claims.some((c) => c.userId === user.id);
  const endLabel = `${formatMinutes(shift.endMinutes)}${shift.endsNextDay ? " next day" : ""}`;

  const staffOptions =
    user.appRole === "MANAGER"
      ? (
          await prisma.user.findMany({
            where: { appRole: "STAFF" },
            orderBy: { name: "asc" },
          })
        ).map((s) => ({
          id: s.id,
          label: `${s.name} (${s.profession?.toLowerCase()})`,
        }))
      : [];

  return (
    <div>
      <AppHeader user={user} />
      <main className="shell space-y-6 py-8">
        <div className="rise">
          <Link href="/shifts" className="text-sm font-medium text-[var(--teal)] hover:underline">
            ← Back to shifts
          </Link>
          <h1
            className="mt-2 text-3xl font-semibold text-[var(--teal-deep)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {utcDateToKey(shift.date)}
          </h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            {formatMinutes(shift.startMinutes)} – {endLabel} · {formatRequirements(shift)}
          </p>
          <p className="mt-2">
            <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase status-${coverage.status}`}>
              {coverage.status}
            </span>
            {coverage.missing.length > 0 && (
              <span className="ml-2 text-sm text-[var(--amber)]">
                Missing: {coverage.missing.join(", ")}
              </span>
            )}
          </p>
        </div>

        <section className="panel rise rise-delay-1 rounded-xl p-5">
          <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
            Assigned staff
          </h2>
          {shift.claims.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Nobody has claimed this shift yet.</p>
          ) : (
            <ul className="space-y-2">
              {shift.claims.map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)]/70 py-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{claim.user.name}</p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {claim.user.profession?.toLowerCase()} · {claim.user.email}
                    </p>
                  </div>
                  {user.appRole === "MANAGER" && (
                    <UnassignButton
                      shiftId={shift.id}
                      staffUserId={claim.userId}
                      name={claim.user.name}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {user.appRole === "STAFF" && (
              <ClaimButton shiftId={shift.id} claimed={claimedByMe} />
            )}
          </div>

          {user.appRole === "MANAGER" && (
            <div className="mt-5 border-t border-[var(--line)] pt-5">
              <AssignStaffForm shiftId={shift.id} staffOptions={staffOptions} />
            </div>
          )}
        </section>

        {user.appRole === "MANAGER" && (
          <>
            <section className="panel rise rise-delay-2 rounded-xl p-5">
              <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
                Edit shift
              </h2>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">
                If you reduce capacity or change times, claims that no longer fit are removed
                automatically and listed in the save confirmation.
              </p>
              <ShiftForm
                mode="edit"
                shiftId={shift.id}
                initialValues={shiftToFormValues(shift)}
              />
            </section>

            <DeleteShiftButton shiftId={shift.id} />
          </>
        )}
      </main>
    </div>
  );
}
