import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

export function AppHeader({ user }: { user: SessionUser }) {
  const isManager = user.appRole === "MANAGER";

  return (
    <header className="border-b border-[var(--line)]/80 bg-white/55 backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p
            className="text-xl font-semibold tracking-tight text-[var(--teal-deep)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Clinic Shift Scheduler
          </p>
          <p className="text-sm text-[var(--ink-soft)]">
            {user.name}
            {user.profession ? ` · ${user.profession.toLowerCase()}` : " · manager"}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <NavLink href="/shifts">Shifts</NavLink>
          {isManager && <NavLink href="/coverage">Coverage</NavLink>}
          {isManager && <NavLink href="/import">Import</NavLink>}
          {isManager && <NavLink href="/import/reports">Import report</NavLink>}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-[var(--ink)] hover:bg-[var(--teal-soft)] hover:text-[var(--teal-deep)]"
    >
      {children}
    </Link>
  );
}
