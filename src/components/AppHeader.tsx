"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

export function AppHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const isManager = user.appRole === "MANAGER";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="shell flex h-[60px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--ink)] text-[10px] font-semibold tracking-wide text-white">
            CS
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              Clinic Shift Scheduler
            </p>
            <p className="truncate text-[12px] font-medium text-[var(--muted)]">
              {user.name}
              {user.profession ? ` · ${user.profession.toLowerCase()}` : " · manager"}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-[14px]">
          <NavLink href="/shifts" pathname={pathname}>
            Shifts
          </NavLink>
          {isManager && (
            <NavLink href="/coverage" pathname={pathname}>
              Coverage
            </NavLink>
          )}
          {isManager && (
            <NavLink href="/import" pathname={pathname} exact>
              Import
            </NavLink>
          )}
          {isManager && (
            <NavLink href="/import/reports" pathname={pathname}>
              Reports
            </NavLink>
          )}
          <form action={logoutAction} className="ml-2">
            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--ink)] hover:bg-[#f5f5f5]"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
  exact = false,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  // Beside-style nav: active = dark text, inactive = muted. No black pill on links.
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full px-3 py-1.5 font-semibold text-[var(--ink)]"
          : "rounded-full px-3 py-1.5 font-medium text-[var(--muted)] hover:text-[var(--ink)]"
      }
    >
      {children}
    </Link>
  );
}
