import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ImportReportsPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.appRole !== "MANAGER") redirect("/shifts");

  const reports = await prisma.importReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader user={session.user} />
      <main className="shell py-7 sm:py-9">
        <h1 className="page-title">Import reports</h1>
        <p className="page-sub mb-6">
          Accepted, rejected, and merged rows from seed and uploaded CSV files.
        </p>

        <div className="space-y-3">
          {reports.length === 0 && (
            <p className="panel rounded-2xl p-6 text-sm text-[var(--ink-soft)]">
              No import reports yet.
            </p>
          )}
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/import/reports/${report.id}`}
              className="panel block rounded-2xl p-4 transition hover:border-[var(--teal)] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{report.filename}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {report.source} · {format(report.createdAt, "d MMM yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[var(--ok-soft)] px-2.5 py-1 text-[var(--ok)]">
                    {report.acceptedCount} accepted
                  </span>
                  <span className="rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[var(--danger)]">
                    {report.rejectedCount} rejected
                  </span>
                  <span className="rounded-full bg-[var(--amber-soft)] px-2.5 py-1 text-[var(--amber)]">
                    {report.mergedCount} merged
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
