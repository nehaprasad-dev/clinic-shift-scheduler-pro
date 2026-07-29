"use client";

import { useActionState, useState } from "react";
import { importCsvAction, type ActionResult } from "@/app/actions";

const initial: ActionResult | null = null;

export function ImportForm({ kind }: { kind: "staff" | "shifts" }) {
  const [state, formAction, pending] = useActionState(importCsvAction, initial);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="relative">
        <label className="file-drop">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <span className="text-sm font-semibold text-[var(--ink)]">
            {fileName ? fileName : "Choose CSV file"}
          </span>
          <span className="text-xs text-[var(--ink-soft)]">
            {kind === "staff" ? "staff.csv" : "shifts.csv"} · click to browse
          </span>
        </label>
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-fit">
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
