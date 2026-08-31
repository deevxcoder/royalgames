import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { STUDIO_GAMES } from "../lib/gamesCatalog";

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================================");
  console.log("🚀 ROYAL GAMES STUDIO v1.0.0 - SUPABASE BOOTSTRAP SEEDER");
  console.log("=========================================================");

  // 1. Initialize Site Settings with Dynamic Global 96.0% RTP
  console.log("1. Setting up Site Settings with Dynamic 96.0% RTP across 11 Games...");
  const rtpMap: Record<string, number> = { _global_rtp: 96.0 };
  STUDIO_GAMES.forEach((g) => {
    rtpMap[g.game_uid] = 96.0;
  });

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {
      siteName: "ROYAL GAMES STUDIO",
      siteSubtitle: "Next-Gen iGaming & B2B GGR Aggregator Platform",
      themeColor: "gold",
      currency: "INR",
      enabledProviders: JSON.stringify(rtpMap),
      disabledGames: "[]",
      callbackUrl: "https://ggrcasinotest.vercel.app/api/callback",
      returnUrl: "https://ggrcasinotest.vercel.app",
    },
    create: {
      id: "default",
      siteName: "ROYAL GAMES STUDIO",
      siteSubtitle: "Next-Gen iGaming & B2B GGR Aggregator Platform",
      themeColor: "gold",
      currency: "INR",
      enabledProviders: JSON.stringify(rtpMap),
      disabledGames: "[]",
      callbackUrl: "https://ggrcasinotest.vercel.app/api/callback",
      returnUrl: "https://ggrcasinotest.vercel.app",
    },
  });

  // 2. Initialize Master Superadmin Account
  console.log("2. Creating/Updating Superadmin Account (admin@royalgames.com)...");
  const adminPasswordHash = crypto.createHash("sha256").update("admin123").digest("hex");
  const adminUser = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {
      email: "admin@royalgames.com",
      isAdmin: true,
      balance: 1000000.0,
      currency: "INR",
    },
    create: {
      username: "superadmin",
      email: "admin@royalgames.com",
      passwordHash: adminPasswordHash,
      isAdmin: true,
      balance: 1000000.0,
      currency: "INR",
    },
  });

  // 3. Initialize Demo / Live Aggregator Operator Client
  console.log("3. Creating Master B2B Operator Client (gateway@royalggr.com)...");
  const operatorPasswordHash = crypto.createHash("sha256").update("royalggr123").digest("hex");
  const masterClient = await prisma.operator.upsert({
    where: { email: "gateway@royalggr.com" },
    update: {
      companyName: "RoyalGGR Provider Network",
      status: "ACTIVE",
      balance: 100000.0,
      ggrRate: 10.0,
      currency: "INR",
      isAdmin: false,
    },
    create: {
      companyName: "RoyalGGR Provider Network",
      email: "gateway@royalggr.com",
      passwordHash: operatorPasswordHash,
      status: "ACTIVE",
      balance: 100000.0,
      ggrRate: 10.0,
      currency: "INR",
      isAdmin: false,
      callbackUrl: "https://ggrcasinotest.vercel.app/api/callback",
      tokens: {
        create: {
          token: "rgs_live_royalggr_master_2026",
          secretKey: "rgs_sec_royalggr_master_secret_2026",
          name: "RoyalGGR Primary Production Key",
          isLive: true,
          ipWhitelist: "127.0.0.1,localhost,::1,0.0.0.0/0",
        },
      },
    },
  });

  // Ensure primary API token exists
  await prisma.apiToken.upsert({
    where: { token: "rgs_live_royalggr_master_2026" },
    update: {
      operatorId: masterClient.id,
      secretKey: "rgs_sec_royalggr_master_secret_2026",
      isLive: true,
      ipWhitelist: "127.0.0.1,localhost,::1,0.0.0.0/0",
    },
    create: {
      operatorId: masterClient.id,
      token: "rgs_live_royalggr_master_2026",
      secretKey: "rgs_sec_royalggr_master_secret_2026",
      name: "RoyalGGR Primary Production Key",
      isLive: true,
      ipWhitelist: "127.0.0.1,localhost,::1,0.0.0.0/0",
    },
  });

  // 4. Initialize External Provider Record (Brand ID 1: Royal Games Studio)
  console.log("4. Registering External Provider Record for Royal Games Studio...");
  const nativeProvider = await prisma.externalProvider.upsert({
    where: { brandId: 1 },
    update: {
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "https://royalgames.vercel.app/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: STUDIO_GAMES.length,
    },
    create: {
      brandId: 1,
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "https://royalgames.vercel.app/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: STUDIO_GAMES.length,
    },
  });

  // 5. Sync All Studio Games to Database
  console.log(`5. Synchronizing ${STUDIO_GAMES.length} HTML5 Studio Games to ExternalGame table...`);
  for (const game of STUDIO_GAMES) {
    await prisma.externalGame.upsert({
      where: { gameUid: game.game_uid },
      update: {
        providerId: nativeProvider.id,
        gameId: game.game_id,
        name: game.name,
        category: game.category,
        rtp: 96.0,
        maxMultiplier: `${game.max_multiplier}x`,
        thumbnail: game.thumbnail,
        isActive: true,
      },
      create: {
        providerId: nativeProvider.id,
        gameId: game.game_id,
        gameUid: game.game_uid,
        name: game.name,
        category: game.category,
        rtp: 96.0,
        maxMultiplier: `${game.max_multiplier}x`,
        thumbnail: game.thumbnail,
        isActive: true,
      },
    });
    console.log(`   ✓ Synced: [${game.game_id}] ${game.name} (${game.game_uid})`);
  }

  console.log("=========================================================");
  console.log("✅ SUPABASE BOOTSTRAP SEEDING COMPLETED SUCCESSFULLY!");
  console.log("   - Superadmin: admin@royalgames.com / admin123");
  console.log("   - Master Client: gateway@royalggr.com / royalggr123");
  console.log("   - Production API Key: rgs_live_royalggr_master_2026");
  console.log(`   - Native Games: ${STUDIO_GAMES.length} Live HTML5 Titles`);
  console.log("=========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
