const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanSlate() {
  console.log("==================================================");
  console.log("   🧹 ROYAL GAMES STUDIO: FRESH DATA RESET       ");
  console.log("==================================================");

  // 1. Log previous counts
  const prevRounds = await prisma.gameRound.count();
  const prevSessions = await prisma.gameSession.count();
  const prevLogs = await prisma.webhookLog.count();
  const prevTx = await prisma.operatorTransaction.count();
  const prevDeposits = await prisma.operatorDepositRequest.count();
  const prevUsers = await prisma.user.count();
  const operators = await prisma.operator.findMany({
    select: { id: true, companyName: true, email: true, balance: true },
  });

  console.log(`Current Records:`);
  console.log(`  - Game Rounds: ${prevRounds}`);
  console.log(`  - Game Sessions: ${prevSessions}`);
  console.log(`  - Webhook Logs: ${prevLogs}`);
  console.log(`  - Operator Transactions: ${prevTx}`);
  console.log(`  - Deposit Requests: ${prevDeposits}`);
  console.log(`  - Total Clients (Operators): ${operators.length}`);
  console.log(`  - Total Players: ${prevUsers}`);
  console.log("\nStarting zero-wipe...");

  // 2. Delete logs & rounds (respecting foreign keys)
  const delLogs = await prisma.webhookLog.deleteMany({});
  console.log(`✓ Deleted ${delLogs.count} Webhook Logs`);

  const delRounds = await prisma.gameRound.deleteMany({});
  console.log(`✓ Deleted ${delRounds.count} Game Rounds`);

  const delSessions = await prisma.gameSession.deleteMany({});
  console.log(`✓ Deleted ${delSessions.count} Game Sessions`);

  const delTx = await prisma.operatorTransaction.deleteMany({});
  console.log(`✓ Deleted ${delTx.count} Operator Transactions`);

  const delDeposits = await prisma.operatorDepositRequest.deleteMany({});
  console.log(`✓ Deleted ${delDeposits.count} Deposit Requests`);

  try {
    const delUserTx = await prisma.transaction.deleteMany({});
    console.log(`✓ Deleted ${delUserTx.count} Player Transactions`);
  } catch (e) {}

  // 3. Reset all clients to exactly ₹10,000 balance
  const updatedOps = await prisma.operator.updateMany({
    data: {
      balance: 10000.0,
    },
  });
  console.log(`✓ Reset ${updatedOps.count} B2B Client Operators to initial balance of ₹10,000.00`);

  // 4. Reset all users/players to ₹10,000 balance
  const updatedUsers = await prisma.user.updateMany({
    data: {
      balance: 10000.0,
    },
  });
  console.log(`✓ Reset ${updatedUsers.count} Players to ₹10,000.00`);

  // 5. Verification
  const finalRounds = await prisma.gameRound.count();
  const finalSessions = await prisma.gameSession.count();
  const clientList = await prisma.operator.findMany({
    select: { companyName: true, email: true, balance: true },
  });

  console.log("\n==================================================");
  console.log("   ✅ RESET COMPLETE & VERIFIED FRESH            ");
  console.log("==================================================");
  console.log(`Game Rounds in DB: ${finalRounds}`);
  console.log(`Game Sessions in DB: ${finalSessions}`);
  console.log(`Clients Updated:`);
  clientList.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.companyName} (${c.email}) -> ₹${c.balance}`);
  });
}

cleanSlate()
  .catch((e) => {
    console.error("Clean slate failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
