"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  claimShiftAction,
  unclaimShiftAction,
  deleteShiftAction,
  unassignStaffAction,
} from "@/app/actions";

export function ClaimButton({ shiftId, claimed }: { shiftId: string; claimed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = claimed
              ? await unclaimShiftAction(shiftId)
              : await claimShiftAction(shiftId);
            if (!result.ok) setError(result.message);
            else router.refresh();
          });
        }}
        className={claimed ? "btn-ghost" : "btn-primary"}
      >
        {pending ? "Working…" : claimed ? "Unclaim" : "Claim shift"}
      </button>
      {error && <p className="max-w-xs text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export function DeleteShiftButton({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this shift and all of its claims?")) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteShiftAction(shiftId);
            if (!result.ok) setError(result.message);
            else router.push("/shifts");
          });
        }}
        className="btn-ghost !border-[var(--danger)]/40 !text-[var(--danger)] hover:!bg-[var(--danger-soft)]"
      >
        {pending ? "Deleting…" : "Delete shift"}
      </button>
      {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export function UnassignButton({
  shiftId,
  staffUserId,
  name,
}: {
  shiftId: string;
  staffUserId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await unassignStaffAction(shiftId, staffUserId);
            if (!result.ok) setError(result.message);
            else router.refresh();
          });
        }}
        className="text-sm font-semibold text-[var(--danger)] hover:underline disabled:opacity-60"
      >
        {pending ? "Removing…" : `Remove ${name}`}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
