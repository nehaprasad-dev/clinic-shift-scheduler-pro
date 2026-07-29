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
          className="field"
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
          className="field"
        />
      </label>

      {state && !state.ok && (
        <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-1">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
