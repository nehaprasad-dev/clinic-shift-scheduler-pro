import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { importStaffFile, importShiftsFile } from "../src/lib/import";

const prisma = new PrismaClient();

async function main() {
  const staffPassword = "staff123";
  const managerPassword = "manager123";
  const staffHash = await hash(staffPassword, 10);
  const managerHash = await hash(managerPassword, 10);

  await prisma.claim.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.importReportItem.deleteMany();
  await prisma.importReport.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "manager@clinicmail.test",
      name: "Clinic Manager",
      passwordHash: managerHash,
      appRole: "MANAGER",
    },
  });

  // Extra seeded staff logins (in addition to CSV import) for easy demo
  const demoStaff = [
    {
      email: "doctor@clinicmail.test",
      name: "Demo Doctor",
      profession: "DOCTOR" as const,
    },
    {
      email: "nurse@clinicmail.test",
      name: "Demo Nurse",
      profession: "NURSE" as const,
    },
    {
      email: "reception@clinicmail.test",
      name: "Demo Receptionist",
      profession: "RECEPTIONIST" as const,
    },
  ];

  for (const person of demoStaff) {
    await prisma.user.create({
      data: {
        email: person.email,
        name: person.name,
        passwordHash: staffHash,
        appRole: "STAFF",
        profession: person.profession,
      },
    });
  }

  const root = path.join(__dirname, "..");
  const staffCsv = readFileSync(path.join(root, "staff.csv"), "utf8");
  const shiftsCsv = readFileSync(path.join(root, "shifts.csv"), "utf8");

  const staffImport = await importStaffFile(
    prisma,
    staffCsv,
    "seed",
    "staff.csv",
    staffHash,
  );
  const shiftsImport = await importShiftsFile(
    prisma,
    shiftsCsv,
    "seed",
    "shifts.csv",
  );

  console.log("Seed complete.");
  console.log(
    `Staff import: ${staffImport.result.acceptedCount} accepted, ${staffImport.result.rejectedCount} rejected, ${staffImport.result.mergedCount} merged`,
  );
  console.log(
    `Shifts import: ${shiftsImport.result.acceptedCount} accepted, ${shiftsImport.result.rejectedCount} rejected, ${shiftsImport.result.mergedCount} merged`,
  );
  console.log("Logins:");
  console.log("  manager@clinicmail.test / manager123");
  console.log("  doctor@clinicmail.test / staff123");
  console.log("  nurse@clinicmail.test / staff123");
  console.log("  reception@clinicmail.test / staff123");
  console.log("  (imported staff emails also use password staff123)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
