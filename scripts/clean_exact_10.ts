import { PrismaClient } from "@prisma/client";

const dbUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.beiinfacldfooypzybrd:ilove%40SB%40143@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log("Setting database active games strictly to CEO 10-Game Suite...");

  const validUids = [
    "royal_skyrush",
    "royal_tigertrail",
    "royal_bombgrid",
    "royal_dropx",
    "royal_cricketblast",
    "royal_infinityx",
    "royal_treasuretower",
    "royal_dicex",
    "royal_cardclimb",
    "royal_luckywheel",
  ];

  // 1. Delete all non-Royal providers (cascades to all external games)
  const deletedProviders = await prisma.externalProvider.deleteMany({
    where: {
      brandId: {
        not: 1,
      },
    },
  });
  console.log(`Deleted ${deletedProviders.count} external providers.`);

  // 2. Delete all non-CEO games from the external_games table
  const deleted = await prisma.externalGame.deleteMany({
    where: {
      NOT: {
        gameUid: {
          in: validUids,
        },
      },
    },
  });
  console.log(`Deleted ${deleted.count} legacy external games from database.`);

  // 2. Activate strictly the 10 games
  const updated = await prisma.externalGame.updateMany({
    where: {
      gameUid: {
        in: validUids,
      },
    },
    data: {
      isActive: true,
    },
  });

  // 3. Ensure Royal Games Studio provider is active and has gameCount = 10
  await prisma.externalProvider.updateMany({
    where: { brandId: 1 },
    data: {
      gameCount: 10,
      isActive: true,
    },
  });

  // 4. Ensure any other provider is inactive
  await prisma.externalProvider.updateMany({
    where: { brandId: { not: 1 } },
    data: {
      isActive: false,
    },
  });

  const activeGames = await prisma.externalGame.findMany({
    where: { isActive: true },
    select: { name: true, gameUid: true },
  });

  console.log(`✅ EXACT Active Games Count: ${activeGames.length}`);
  console.log("List:", activeGames.map((g, i) => `${i + 1}. ${g.name} (${g.gameUid})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
