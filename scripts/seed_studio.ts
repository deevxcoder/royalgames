import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Royal Games Studio B2B Aggregator Clients and API Keys...");

  // 1. Create or update RoyalGGR as an authorized B2B aggregator client
  const royalGgrClient = await prisma.operator.upsert({
    where: { email: "gateway@royalggr.com" },
    update: {
      companyName: "RoyalGGR Provider Network",
      status: "ACTIVE",
    },
    create: {
      companyName: "RoyalGGR Provider Network",
      email: "gateway@royalggr.com",
      passwordHash: crypto.createHash("sha256").update("royalggr123").digest("hex"),
      status: "ACTIVE",
      callbackUrl: "http://localhost:3001/api/v1/round/resolve",
      ggrRate: 10.0,
      currency: "INR",
      balance: 100000.0,
      tokens: {
        create: {
          token: "rgs_live_royalggr_master_2026",
          secretKey: "rgs_sec_royalggr_master_secret_2026",
          name: "RoyalGGR Primary Gateway Key",
          isLive: true,
          ipWhitelist: "127.0.0.1,localhost,::1",
        },
      },
    },
  });

  // Ensure token exists
  await prisma.apiToken.upsert({
    where: { token: "rgs_live_royalggr_master_2026" },
    update: {
      operatorId: royalGgrClient.id,
      secretKey: "rgs_sec_royalggr_master_secret_2026",
      isLive: true,
    },
    create: {
      operatorId: royalGgrClient.id,
      token: "rgs_live_royalggr_master_2026",
      secretKey: "rgs_sec_royalggr_master_secret_2026",
      name: "RoyalGGR Primary Gateway Key",
      isLive: true,
      ipWhitelist: "127.0.0.1,localhost,::1",
    },
  });

  // 2. Update Provider record in external_providers for Brand ID 1 (Royal Games Studio)
  await prisma.externalProvider.upsert({
    where: { brandId: 1 },
    update: {
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: 6,
    },
    create: {
      brandId: 1,
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: 6,
    },
  });

  console.log("✅ Seeded RoyalGGR Studio Client with API Key: rgs_live_royalggr_master_2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
