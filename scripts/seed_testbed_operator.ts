import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const token = "roy_testbed_casino_token_999";
  const secretKey = "roy_sec_testbed_casino_key_888";
  const email = "contact@royalgamescasino.com";

  // Update existing operator if previously named Royal Game Casino
  const prevOperator = await prisma.operator.findFirst({
    where: {
      OR: [
        { email: "lab@royalgamecasino.com" },
        { companyName: { contains: "Royal Game Casino" } },
        { email },
      ],
    },
    include: { tokens: true },
  });

  if (prevOperator) {
    await prisma.operator.update({
      where: { id: prevOperator.id },
      data: {
        companyName: "Royal Games Casino",
        email,
        callbackUrl: "http://localhost:3001/api/callback",
      },
    });
    console.log("Updated Operator companyName to 'Royal Games Casino' in Studio Database.");
  } else {
    await prisma.operator.create({
      data: {
        companyName: "Royal Games Casino",
        email,
        passwordHash: "testbed_pass_hash",
        balance: 100000.0,
        currency: "INR",
        ggrRate: 10.0,
        status: "ACTIVE",
        callbackUrl: "http://localhost:3001/api/callback",
        tokens: {
          create: {
            token,
            secretKey,
            name: "Royal Games Casino Gateway Key",
            isLive: true,
          },
        },
      },
    });
    console.log("Created Operator 'Royal Games Casino' in Studio Database.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
