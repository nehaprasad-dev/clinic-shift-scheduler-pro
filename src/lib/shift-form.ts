import { formatMinutes } from "./time";

export type ShiftFormValues = {
  date: string;
  startTime: string;
  endTime: string;
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
};

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
