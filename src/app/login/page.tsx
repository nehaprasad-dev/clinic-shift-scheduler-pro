import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session.user) redirect("/shifts");

  return (
    <main className="shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-2">
      <section className="max-w-lg">
        <p className="mb-4 inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">
          Clinic operations
        </p>
        <h1 className="page-title !text-4xl sm:!text-5xl">
          Make clinic shift coverage easy to manage.
        </h1>
        <p className="page-sub !text-base">
          Managers create shifts. Staff claim them. The coverage board shows exactly which roles
          are still missing.
        </p>

        <div className="mt-7 space-y-3">
          <div className="panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Manager
            </p>
            <p className="mt-1 text-sm font-medium">manager@clinicmail.test / manager123</p>
          </div>
          <div className="panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Nurse
            </p>
            <p className="mt-1 text-sm font-medium">nurse@clinicmail.test / staff123</p>
          </div>
          <div className="panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Doctor
            </p>
            <p className="mt-1 text-sm font-medium">doctor@clinicmail.test / staff123</p>
          </div>
        </div>
      </section>

      <section className="panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
        <p className="mb-6 mt-1 text-sm text-[var(--ink-soft)]">
          Use a demo account. Best dates: August 2026.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
