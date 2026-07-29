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
          <p className="mb-2 inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">
            Data import
          </p>
          <h1 className="page-title">Import CSV</h1>
          <p className="page-sub">
            Same cleaning rules as seed. Use the correct box — wrong file type is blocked.
          </p>
          <Link
            href="/import/reports"
            className="mt-3 inline-block text-sm font-semibold underline-offset-2 hover:underline"
          >
            View import reports →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="panel rounded-2xl p-5">
            <h2 className="text-base font-bold">Staff file</h2>
            <p className="mb-4 mt-1 text-sm text-[var(--ink-soft)]">
              Columns: staff_id, full_name, role, email
            </p>
            <ImportForm kind="staff" />
          </section>

          <section className="panel rounded-2xl p-5">
            <h2 className="text-base font-bold">Shifts file</h2>
            <p className="mb-4 mt-1 text-sm text-[var(--ink-soft)]">
              Columns: shift_id, date, start_time, end_time, requirements
            </p>
            <ImportForm kind="shifts" />
          </section>
        </div>
      </main>
    </div>
  );
}
