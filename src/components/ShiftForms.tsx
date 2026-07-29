"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  assignStaffAction,
  createShiftAction,
  updateShiftAction,
  type ActionResult,
} from "@/app/actions";
import { formatMinutes } from "@/lib/time";

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
      <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Assign staff</span>
        <select
          name="staffUserId"
          required
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
          defaultValue=""
        >
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-deep)] disabled:opacity-60"
      >
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

type ShiftFormValues = {
  date: string;
  startTime: string;
  endTime: string;
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
};

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

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-[var(--ink-soft)]">Date</span>
        <input
          type="date"
          name="date"
          required
          defaultValue={defaults.date}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">Start</span>
        <input
          type="time"
          name="startTime"
          required
          defaultValue={defaults.startTime}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ink-soft)]">End</span>
        <input
          type="time"
          name="endTime"
          required
          defaultValue={defaults.endTime}
          className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--teal-deep)] disabled:opacity-60"
        >
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--ink-soft)]">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        required
        defaultValue={defaultValue}
        className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
      />
    </label>
  );
}

export function shiftToFormValues(shift: {
  date: Date;
  startMinutes: number;
  endMinutes: number;
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
}): ShiftFormValues {
  return {
    date: shift.date.toISOString().slice(0, 10),
    startTime: formatMinutes(shift.startMinutes),
    endTime: formatMinutes(shift.endMinutes),
    requiredDoctors: shift.requiredDoctors,
    requiredNurses: shift.requiredNurses,
    requiredReceptionists: shift.requiredReceptionists,
  };
}
