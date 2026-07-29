import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { AssignStaffForm, ShiftForm } from "@/components/ShiftForms";
import { ClaimButton, DeleteShiftButton, UnassignButton } from "@/components/ShiftActions";
import { getSession } from "@/lib/auth";
import { computeCoverage, formatRequirements } from "@/lib/coverage";
import { prisma } from "@/lib/db";
import { shiftToFormValues } from "@/lib/shift-form";
import { formatMinutes } from "@/lib/time";

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
  const dateLabel = format(shift.date, "EEE d MMM yyyy");

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
      <main className="shell space-y-5 py-7 sm:py-9">
        <div>
          <Link href="/shifts" className="text-sm font-semibold text-[var(--teal)] hover:underline">
            ← Back to shifts
          </Link>
          <h1 className="page-title mt-2">{dateLabel}</h1>
          <p className="page-sub">
            {formatMinutes(shift.startMinutes)} – {endLabel} · {formatRequirements(shift)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`badge badge-${coverage.status}`}>{coverage.status}</span>
            <span className="text-sm text-[var(--ink-soft)]">
              D {coverage.filled.doctors}/{coverage.required.doctors} · N{" "}
              {coverage.filled.nurses}/{coverage.required.nurses} · R{" "}
              {coverage.filled.receptionists}/{coverage.required.receptionists}
            </span>
          </div>
          {coverage.missing.length > 0 && (
            <p className="mt-2 text-sm font-medium text-[var(--amber)]">
              Still need: {coverage.missing.join(", ")}
            </p>
          )}
        </div>

        <section className="panel rounded-2xl p-5">
          <h2 className="mb-3 text-lg font-bold">Assigned staff</h2>
          {shift.claims.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Nobody has claimed this shift yet.</p>
          ) : (
            <ul className="space-y-2">
              {shift.claims.map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--paper)] px-3 py-2.5"
                >
                  <div>
                    <p className="font-semibold">{claim.user.name}</p>
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
            <section className="panel rounded-2xl p-5">
              <h2 className="mb-2 text-lg font-bold">Edit shift</h2>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">
                If you reduce capacity or change times, claims that no longer fit are removed
                automatically.
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
