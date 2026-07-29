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
      <main className="shell space-y-6 py-8">
        <div>
          <Link
            href="/import/reports"
            className="text-sm font-medium text-[var(--teal)] hover:underline"
          >
            ← All reports
          </Link>
          <h1
            className="mt-2 text-3xl font-semibold text-[var(--teal-deep)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {report.filename}
          </h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            {report.source} · {format(report.createdAt, "d MMM yyyy HH:mm")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Accepted" value={report.acceptedCount} tone="ok" />
          <Stat label="Rejected" value={report.rejectedCount} tone="danger" />
          <Stat label="Merged" value={report.mergedCount} tone="amber" />
        </div>

        <section className="panel rounded-xl p-5">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
            Rejected and merged rows
          </h2>
          {rejectedOrMerged.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No rejected or merged rows.</p>
          ) : (
            <div className="space-y-3">
              {rejectedOrMerged.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-[var(--line)] bg-white/70 p-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                        item.kind === "rejected"
                          ? "bg-[#fdeceb] text-[var(--danger)]"
                          : "bg-[#fff3df] text-[var(--amber)]"
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
                    <span className="font-medium">Issue:</span> {item.issue}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Action:</span> {item.action}
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
  const color =
    tone === "ok"
      ? "text-[var(--ok)]"
      : tone === "danger"
        ? "text-[var(--danger)]"
        : "text-[var(--amber)]";
  return (
    <div className="panel rounded-xl p-4">
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
      <p className={`text-3xl font-semibold ${color}`} style={{ fontFamily: "var(--font-display), serif" }}>
        {value}
      </p>
    </div>
  );
}
