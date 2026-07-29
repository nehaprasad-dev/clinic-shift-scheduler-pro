import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ShiftForm } from "@/components/ShiftForms";
import { getSession } from "@/lib/auth";

export default async function NewShiftPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.appRole !== "MANAGER") redirect("/shifts");

  return (
    <div>
      <AppHeader user={session.user} />
      <main className="shell py-8">
        <Link href="/shifts" className="text-sm font-medium text-[var(--teal)] hover:underline">
          ← Back to shifts
        </Link>
        <h1
          className="mt-2 mb-6 text-3xl font-semibold text-[var(--teal-deep)]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          New shift
        </h1>
        <section className="panel max-w-2xl rounded-xl p-5">
          <ShiftForm mode="create" />
        </section>
      </main>
    </div>
  );
}
