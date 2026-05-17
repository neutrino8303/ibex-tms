/**
 * Ensures A320-OPC → A320-TR conditional link and recomputes effective expiries.
 * Run: pnpm db:backfill-conditionals
 */
import { PrismaClient } from "@prisma/client";
import {
  recomputeAllEffectiveExpiriesForUser,
  syncQualificationConditionals,
} from "../server/qualification-expiry";

const prisma = new PrismaClient();

async function main() {
  const opc = await prisma.qualification.findUnique({ where: { code: "A320-OPC" } });
  const tr = await prisma.qualification.findUnique({ where: { code: "A320-TR" } });

  if (!opc || !tr) {
    console.error("Missing A320-OPC or A320-TR in catalog. Run db:seed first.");
    process.exit(1);
  }

  await syncQualificationConditionals(opc.id, [tr.id]);
  console.log(`Linked ${opc.code} → conditional ${tr.code}`);

  const pilots = await prisma.user.findMany({
    where: { roles: { some: { role: "PILOT" } } },
    select: { id: true, firstName: true, lastName: true },
  });

  for (const pilot of pilots) {
    await recomputeAllEffectiveExpiriesForUser(pilot.id);
  }
  console.log(`Recomputed effective expiry for ${pilots.length} pilot(s).`);

  const sofia = await prisma.user.findFirst({
    where: { email: "pilot.ribeiro@tms.local" },
  });
  const sofiaTr = sofia
    ? await prisma.userQualification.findFirst({
        where: {
          userId: sofia.id,
          qualificationId: tr.id,
        },
      })
    : null;
  const sofiaOpc = sofia
    ? await prisma.userQualification.findFirst({
        where: {
          userId: sofia.id,
          qualificationId: opc.id,
        },
      })
    : null;

  if (sofia && sofiaTr && sofiaOpc) {
    const demoTrExpiry = new Date("2026-04-15");
    await prisma.userQualification.update({
      where: { id: sofiaTr.id },
      data: {
        originalExpiryDate: demoTrExpiry,
        expiryDate: demoTrExpiry,
        limitedByQualificationId: null,
      },
    });
    await recomputeAllEffectiveExpiriesForUser(sofia.id);
    console.log(
      "Demo: Sofia Ribeiro — A320-TR set to 15 Apr 2026 so A320-OPC effective expiry is reduced.",
    );
  }

  const reduced = await prisma.userQualification.findMany({
    where: { limitedByQualificationId: { not: null } },
    include: {
      qualification: { select: { code: true } },
      limitedByQualification: { select: { name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  for (const row of reduced) {
    console.log(
      `  ${row.user.firstName} ${row.user.lastName}: ${row.qualification.code} limited by ${row.limitedByQualification?.name}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
