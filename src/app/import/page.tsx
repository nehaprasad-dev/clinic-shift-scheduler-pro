import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ImportForm } from "@/components/ImportForm";
import { getSession } from "@/lib/auth";

export default async function ImportPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.appRole !== "MANAGER") redirect("/shifts");

  return (
    <div>
      <AppHeader user={session.user} />
      <main className="shell space-y-6 py-8">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--teal-deep)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Import CSV
          </h1>
          <p className="mt-1 max-w-2xl text-[var(--ink-soft)]">
            Upload staff or shift exports using the same cleaning rules as the seed importer.
            Results appear on the import report page.
          </p>
          <Link
            href="/import/reports"
            className="mt-3 inline-block text-sm font-medium text-[var(--teal)] hover:underline"
          >
            View import reports →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="panel rounded-xl p-5">
            <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
              Staff file
            </h2>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              Expected columns: staff_id, full_name, role, email
            </p>
            <ImportForm kind="staff" />
          </section>

          <section className="panel rounded-xl p-5">
            <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
              Shifts file
            </h2>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              Expected columns: shift_id, date, start_time, end_time, requirements
            </p>
            <ImportForm kind="shifts" />
          </section>
        </div>
      </main>
    </div>
  );
}
