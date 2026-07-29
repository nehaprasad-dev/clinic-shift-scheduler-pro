import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session.user) redirect("/shifts");

  return (
    <main className="shell grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rise max-w-xl">
        <p
          className="text-4xl font-semibold leading-tight text-[var(--teal-deep)] sm:text-5xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Clinic Shift Scheduler
        </p>
        <p className="mt-4 max-w-md text-lg text-[var(--ink-soft)]">
          Claim open shifts, see what roles are still missing, and keep the week covered.
        </p>
      </section>

      <section className="panel rise rise-delay-1 rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display), serif" }}>
          Sign in
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-soft)]">
          Use a seeded manager or staff account from the README.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
