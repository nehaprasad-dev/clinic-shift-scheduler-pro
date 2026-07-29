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
      <main className="shell py-7 sm:py-9">
        <Link href="/shifts" className="text-sm font-semibold text-[var(--teal)] hover:underline">
          ← Back to shifts
        </Link>
        <h1 className="page-title mt-2 mb-5">New shift</h1>
        <section className="panel max-w-2xl rounded-2xl p-5">
          <ShiftForm mode="create" />
        </section>
      </main>
    </div>
  );
}
