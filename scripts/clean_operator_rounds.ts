import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetStudioOperator() {
  console.log("🧹 Resetting Royal Games Studio records for Royal Games Casino...");

  const operator = await prisma.operator.findFirst({
    where: { companyName: "Royal Games Casino" },
  });

  if (operator) {
    // Delete Game Rounds for this operator
    const deletedRounds = await prisma.gameRound.deleteMany({
      where: {
        OR: [
          { operatorId: operator.id },
          { serialNumber: { startsWith: "SN_SIM_" } },
          { serialNumber: { startsWith: "SN_SKY_" } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedRounds.count} test game rounds from Studio database.`);

    // Reset operator balance to default 1,00,000
    await prisma.operator.update({
      where: { id: operator.id },
      data: { balance: 100000.0 },
    });
    console.log(`✓ Reset Operator '${operator.companyName}' balance to ₹1,00,000.00.`);
  } else {
    console.log("Operator 'Royal Games Casino' not found in studio db.");
  }

  console.log("🎉 Royal Games Studio operator records are clean and fresh!");
}

resetStudioOperator()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
