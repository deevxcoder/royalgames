const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

async function main() {
  console.log("Seeding Royal Games demo operator...");

  const existing = await prisma.operator.findUnique({
    where: { email: "partner@casino.com" },
  });

  if (!existing) {
    const operator = await prisma.operator.create({
      data: {
        companyName: "Royal Casino Partner",
        email: "partner@casino.com",
        passwordHash: crypto.createHash("sha256").update("password123").digest("hex"),
        balance: 10000.0, // ₹10,000 demo GGR credit
        ggrRate: 10.0,
      },
    });

    const token = "roy_live_79b49f0e7f96cb36a53abeba98126bc7";
    const secretKey = crypto.randomBytes(32).toString("hex");

    await prisma.apiToken.create({
      data: {
        operatorId: operator.id,
        token,
        secretKey,
        name: "Default Production API Token",
      },
    });

    console.log("✅ Seeded Operator: partner@casino.com");
    console.log("✅ Created API Token:", token);
  } else {
    console.log("Operator already exists.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
