import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ImportReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.appRole !== "MANAGER") redirect("/shifts");

  const { id } = await params;
  const report = await prisma.importReport.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ kind: "asc" }, { rowNumber: "asc" }] },
    },
  });
  if (!report) notFound();

  const rejectedOrMerged = report.items.filter(
    (item) => item.kind === "rejected" || item.kind === "merged",
  );

  return (
    <div>
      <AppHeader user={session.user} />
      <main className="shell space-y-6 py-7 sm:py-9">
        <div>
          <Link
            href="/import/reports"
            className="text-sm font-semibold text-[var(--teal)] hover:underline"
          >
            ← All reports
          </Link>
          <h1 className="page-title mt-2">{report.filename}</h1>
          <p className="page-sub">
            {report.source} · {format(report.createdAt, "d MMM yyyy HH:mm")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Accepted" value={report.acceptedCount} tone="ok" />
          <Stat label="Rejected" value={report.rejectedCount} tone="danger" />
          <Stat label="Merged" value={report.mergedCount} tone="amber" />
        </div>

        <section className="panel rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">Rejected and merged rows</h2>
          {rejectedOrMerged.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No rejected or merged rows.</p>
          ) : (
            <div className="space-y-3">
              {rejectedOrMerged.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3.5"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        item.kind === "rejected"
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--amber-soft)] text-[var(--amber)]"
                      }`}
                    >
                      {item.kind}
                    </span>
                    <span className="text-[var(--ink-soft)]">Row {item.rowNumber}</span>
                  </div>
                  <p className="break-words font-mono text-xs text-[var(--ink-soft)]">
                    {item.rawRow}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Issue:</span> {item.issue}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Action:</span> {item.action}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "danger" | "amber";
}) {
  const styles =
    tone === "ok"
      ? "text-[var(--ok)] bg-[var(--ok-soft)]"
      : tone === "danger"
        ? "text-[var(--danger)] bg-[var(--danger-soft)]"
        : "text-[var(--amber)] bg-[var(--amber-soft)]";

  return (
    <div className={`rounded-2xl p-4 ${styles}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
