"use client";

import { useActionState } from "react";
import { importCsvAction, type ActionResult } from "@/app/actions";

const initial: ActionResult | null = null;

export function ImportForm({ kind }: { kind: "staff" | "shifts" }) {
  const [state, formAction, pending] = useActionState(importCsvAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="kind" value={kind} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">
          {kind === "staff" ? "Staff CSV" : "Shifts CSV"}
        </span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-deep)] disabled:opacity-60"
      >
        {pending ? "Importing…" : "Upload and import"}
      </button>
      {state && (
        <p className={`text-sm ${state.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
