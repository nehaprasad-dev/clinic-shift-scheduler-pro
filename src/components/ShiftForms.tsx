"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  assignStaffAction,
  createShiftAction,
  updateShiftAction,
  type ActionResult,
} from "@/app/actions";
import { type ShiftFormValues } from "@/lib/shift-form";

const initial: ActionResult | null = null;

export function AssignStaffForm({
  shiftId,
  staffOptions,
}: {
  shiftId: string;
  staffOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(assignStaffAction, initial);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="shiftId" value={shiftId} />
      <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Assign staff</span>
        <select name="staffUserId" required className="field" defaultValue="">
          <option value="" disabled>
            Choose a staff member
          </option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Assigning…" : "Assign"}
      </button>
      {state && (
        <p className={`w-full text-sm ${state.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function ShiftForm({
  mode,
  shiftId,
  initialValues,
}: {
  mode: "create" | "edit";
  shiftId?: string;
  initialValues?: ShiftFormValues;
}) {
  const router = useRouter();
  const action = mode === "create" ? createShiftAction : updateShiftAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok && mode === "create") {
      router.push("/shifts");
      router.refresh();
    }
    if (state?.ok && mode === "edit") {
      router.refresh();
    }
  }, [state, mode, router]);

  const defaults: ShiftFormValues = initialValues ?? {
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    requiredDoctors: 1,
    requiredNurses: 1,
    requiredReceptionists: 0,
  };

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {shiftId && <input type="hidden" name="shiftId" value={shiftId} />}

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium text-[var(--ink-soft)]">Date</span>
        <input type="date" name="date" required defaultValue={defaults.date} className="field" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Start</span>
        <input
          type="time"
          name="startTime"
          required
          defaultValue={defaults.startTime}
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">End</span>
        <input
          type="time"
          name="endTime"
          required
          defaultValue={defaults.endTime}
          className="field"
        />
      </label>

      <NumberField name="requiredDoctors" label="Doctors needed" defaultValue={defaults.requiredDoctors} />
      <NumberField name="requiredNurses" label="Nurses needed" defaultValue={defaults.requiredNurses} />
      <NumberField
        name="requiredReceptionists"
        label="Receptionists needed"
        defaultValue={defaults.requiredReceptionists}
      />

      {state && (
        <p className={`sm:col-span-2 text-sm ${state.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : mode === "create" ? "Create shift" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--ink-soft)]">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        required
        defaultValue={defaultValue}
        className="field"
      />
    </label>
  );
}
