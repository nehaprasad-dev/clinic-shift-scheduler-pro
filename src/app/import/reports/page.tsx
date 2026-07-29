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
      <main className="shell py-8">
        <h1
          className="text-3xl font-semibold text-[var(--teal-deep)]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Import report
        </h1>
        <p className="mt-1 mb-6 text-[var(--ink-soft)]">
          Accepted, rejected, and merged rows from seed and uploaded CSV files.
        </p>

        <div className="space-y-3">
          {reports.length === 0 && (
            <p className="panel rounded-xl p-5 text-[var(--ink-soft)]">No import reports yet.</p>
          )}
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/import/reports/${report.id}`}
              className="panel block rounded-xl p-4 hover:border-[var(--teal)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
                    {report.filename}
                  </p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {report.source} · {format(report.createdAt, "d MMM yyyy HH:mm")}
                  </p>
                </div>
                <p className="text-sm">
                  <span className="text-[var(--ok)]">{report.acceptedCount} accepted</span>
                  {" · "}
                  <span className="text-[var(--danger)]">{report.rejectedCount} rejected</span>
                  {" · "}
                  <span className="text-[var(--amber)]">{report.mergedCount} merged</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
