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
        className={
          claimed
            ? "rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold hover:bg-[var(--paper-2)] disabled:opacity-60"
            : "rounded-md bg-[var(--teal)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-deep)] disabled:opacity-60"
        }
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
        className="rounded-md border border-[var(--danger)]/30 px-3 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[#fdeceb] disabled:opacity-60"
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
        className="text-sm font-medium text-[var(--danger)] hover:underline disabled:opacity-60"
      >
        {pending ? "Removing…" : `Remove ${name}`}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
