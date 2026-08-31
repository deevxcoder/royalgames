const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const op = await prisma.operator.findFirst({
    where: {
      OR: [
        { companyName: { contains: "liveGGRtest", mode: "insensitive" } },
        { email: { contains: "liveGGRtest", mode: "insensitive" } },
        { email: "crickethotstar63@gmail.com" },
      ],
    },
    include: {
      tokens: true,
      transactions: { orderBy: { createdAt: "desc" } },
      deposits: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!op) {
    console.log("Operator liveGGRtest not found!");
    return;
  }

  const rounds = await prisma.gameRound.findMany({
    where: { operatorId: op.id },
    orderBy: { createdAt: "asc" },
  });

  const sessions = await prisma.gameSession.findMany({
    where: { operatorId: op.id },
    orderBy: { createdAt: "asc" },
  });

  let totalBet = 0;
  let totalWin = 0;
  let totalGgrFee = 0;
  const gameBreakdown = {};
  const playerBreakdown = {};

  for (const r of rounds) {
    totalBet += r.betAmount;
    totalWin += r.winAmount;
    totalGgrFee += r.ggrFeeDeducted;

    // Game breakdown
    if (!gameBreakdown[r.gameUid]) {
      gameBreakdown[r.gameUid] = {
        name: r.gameName || r.gameUid,
        rounds: 0,
        bet: 0,
        win: 0,
        ggrFee: 0,
      };
    }
    gameBreakdown[r.gameUid].rounds++;
    gameBreakdown[r.gameUid].bet += r.betAmount;
    gameBreakdown[r.gameUid].win += r.winAmount;
    gameBreakdown[r.gameUid].ggrFee += r.ggrFeeDeducted;

    // Player breakdown
    const playerKey = r.memberAccount || r.userId || "anonymous";
    if (!playerBreakdown[playerKey]) {
      playerBreakdown[playerKey] = { rounds: 0, bet: 0, win: 0 };
    }
    playerBreakdown[playerKey].rounds++;
    playerBreakdown[playerKey].bet += r.betAmount;
    playerBreakdown[playerKey].win += r.winAmount;
  }

  const clientGgrProfit = totalBet - totalWin;
  const clientHoldMargin = totalBet > 0 ? ((clientGgrProfit / totalBet) * 100).toFixed(2) : "0.00";
  const playerRtpRealized = totalBet > 0 ? ((totalWin / totalBet) * 100).toFixed(2) : "0.00";

  console.log("=== OPERATOR INFO ===");
  console.log("ID:", op.id);
  console.log("Name:", op.companyName);
  console.log("Email:", op.email);
  console.log("Status:", op.status);
  console.log("Current Prepaid Balance: ₹" + op.balance);
  console.log("Contract GGR Rate:", op.ggrRate + "%");
  console.log("Callback URL:", op.callbackUrl);
  console.log("Created At:", op.createdAt);

  console.log("\n=== FINANCIAL OVERVIEW ===");
  console.log("Total Rounds Played:", rounds.length);
  console.log("Total Game Sessions:", sessions.length);
  console.log("Total Turnover (Total Bets): ₹" + totalBet.toFixed(2));
  console.log("Total Wins Paid to Players: ₹" + totalWin.toFixed(2));
  console.log("Client Gross Gaming Revenue (Bet - Win): ₹" + clientGgrProfit.toFixed(2));
  console.log("Client GGR Hold Margin (%): " + clientHoldMargin + "%");
  console.log("Realized Player RTP (%): " + playerRtpRealized + "%");
  console.log("Studio GGR Commission Deducted: ₹" + totalGgrFee.toFixed(2));
  console.log("Client Net Profit after Studio Fee: ₹" + (clientGgrProfit - totalGgrFee).toFixed(2));

  console.log("\n=== GAME WISE BREAKDOWN ===");
  console.table(gameBreakdown);

  console.log("\n=== PLAYER BREAKDOWN ===");
  console.table(playerBreakdown);

  console.log("\n=== TRANSACTIONS HISTORY ===");
  console.table(op.transactions);

  console.log("\n=== RECENT ROUNDS (LATEST 10) ===");
  console.table(
    rounds.slice(-10).map((r) => ({
      serialNumber: r.serialNumber,
      game: r.gameUid,
      bet: r.betAmount,
      win: r.winAmount,
      ggrFee: r.ggrFeeDeducted,
      playerBalAfter: r.creditAmount,
      time: r.createdAt,
    }))
  );
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
