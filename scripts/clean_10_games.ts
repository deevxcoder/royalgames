import { PrismaClient } from "@prisma/client";
import { STUDIO_GAMES } from "../lib/gamesCatalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting active games strictly to CEO 10-Game Suite...");

  // 1. Disable all games first
  await prisma.externalGame.updateMany({
    data: {
      isActive: false,
    },
  });

  const validUids = STUDIO_GAMES.map((g) => g.game_uid);

  // 2. Ensure Royal Games Studio provider is active and has gameCount = 10
  const provider = await prisma.externalProvider.upsert({
    where: { brandId: 1 },
    update: {
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: 10,
    },
    create: {
      brandId: 1,
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: 10,
    },
  });

  // 3. Upsert and activate strictly the 10 games
  for (const game of STUDIO_GAMES) {
    await prisma.externalGame.upsert({
      where: { gameUid: game.game_uid },
      update: {
        providerId: provider.id,
        gameId: game.game_id,
        name: game.name,
        category: game.category.toLowerCase().includes("crash") || game.category.toLowerCase().includes("multiplier")
          ? "crash"
          : game.category.toLowerCase().includes("live") || game.category.toLowerCase().includes("cards") || game.category.toLowerCase().includes("wheel")
          ? "live"
          : "originals",
        rtp: game.rtp,
        maxMultiplier: `${game.max_multiplier}x`,
        thumbnail: game.thumbnail,
        banner: game.thumbnail,
        isActive: true,
        isFeatured: game.isFeatured || false,
      },
      create: {
        providerId: provider.id,
        gameId: game.game_id,
        gameUid: game.game_uid,
        name: game.name,
        category: game.category.toLowerCase().includes("crash") || game.category.toLowerCase().includes("multiplier")
          ? "crash"
          : game.category.toLowerCase().includes("live") || game.category.toLowerCase().includes("cards") || game.category.toLowerCase().includes("wheel")
          ? "live"
          : "originals",
        rtp: game.rtp,
        maxMultiplier: `${game.max_multiplier}x`,
        thumbnail: game.thumbnail,
        banner: game.thumbnail,
        isActive: true,
        isFeatured: game.isFeatured || false,
      },
    });
  }

  // Count active games
  const activeCount = await prisma.externalGame.count({
    where: { isActive: true },
  });

  console.log(`✅ Active games count is now strictly: ${activeCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
