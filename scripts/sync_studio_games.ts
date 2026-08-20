import { PrismaClient } from "@prisma/client";
import { STUDIO_GAMES } from "../lib/gamesCatalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Synchronizing Studio 10-Game Suite to Database...");

  // Ensure Royal Games Studio provider exists
  const provider = await prisma.externalProvider.upsert({
    where: { brandId: 1 },
    update: {
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: STUDIO_GAMES.length,
    },
    create: {
      brandId: 1,
      name: "Royal Games Studio",
      type: "ROYAL_NATIVE",
      apiUrl: "http://localhost:3002/api/v1",
      apiToken: "rgs_live_royalggr_master_2026",
      apiSecret: "rgs_sec_royalggr_master_secret_2026",
      isActive: true,
      gameCount: STUDIO_GAMES.length,
    },
  });

  for (const game of STUDIO_GAMES) {
    await prisma.externalGame.upsert({
      where: { gameUid: game.game_uid },
      update: {
        providerId: provider.id,
        gameId: game.game_id,
        name: game.name,
        category: game.category.toLowerCase().includes("crash")
          ? "crash"
          : game.category.toLowerCase().includes("live") || game.category.toLowerCase().includes("table")
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
        category: game.category.toLowerCase().includes("crash")
          ? "crash"
          : game.category.toLowerCase().includes("live") || game.category.toLowerCase().includes("table")
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
    console.log(`✅ Synced Studio Game: [${game.game_uid}] ${game.name}`);
  }

  console.log("All Studio games synchronized successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
