"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions";

const initial: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-[var(--teal)] focus:ring-2"
          placeholder="manager@clinicmail.test"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-[var(--teal)] focus:ring-2"
        />
      </label>

      {state && !state.ok && (
        <p className="rounded-md bg-[#fdeceb] px-3 py-2 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-[var(--teal)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--teal-deep)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
