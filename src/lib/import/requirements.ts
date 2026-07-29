export type RoleRequirements = {
  requiredDoctors: number;
  requiredNurses: number;
  requiredReceptionists: number;
};

/**
 * Parse requirements like "nurses=2;doctors=1;receptionists=0".
 * Missing keys default to 0. Natural language strings are rejected.
 */
export function parseRequirements(raw: string): RoleRequirements | null {
  const value = raw.trim();
  if (!value) return null;

  // Must look like key=value pairs separated by semicolons
  if (!/^[a-zA-Z]+=\d+(\s*;\s*[a-zA-Z]+=\d+)*$/.test(value)) {
    return null;
  }

  const result: RoleRequirements = {
    requiredDoctors: 0,
    requiredNurses: 0,
    requiredReceptionists: 0,
  };

  const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [keyRaw, countRaw] = part.split("=");
    const key = keyRaw.trim().toLowerCase();
    const count = Number(countRaw.trim());
    if (!Number.isInteger(count) || count < 0) return null;

    if (key === "doctors" || key === "doctor") {
      result.requiredDoctors = count;
    } else if (key === "nurses" || key === "nurse") {
      result.requiredNurses = count;
    } else if (key === "receptionists" || key === "receptionist") {
      result.requiredReceptionists = count;
    } else {
      return null;
    }
  }

  if (
    result.requiredDoctors === 0 &&
    result.requiredNurses === 0 &&
    result.requiredReceptionists === 0
  ) {
    return null;
  }

  return result;
}
