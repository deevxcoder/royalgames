import { NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [clientsCount, activeSessionsCount, totalRounds, roundsData] = await Promise.all([
      db.operator.count(),
      db.gameSession.count({ where: { status: "ACTIVE" } }),
      db.gameRound.count(),
      db.gameRound.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          betAmount: true,
          winAmount: true,
          gameUid: true,
          createdAt: true,
        },
      }),
    ]);

    const totalTurnover = roundsData.reduce((acc, r) => acc + (r.betAmount || 0), 0);
    const totalPayout = roundsData.reduce((acc, r) => acc + (r.winAmount || 0), 0);
    const studioGgr = totalTurnover - totalPayout;
    const actualRtp = totalTurnover > 0 ? (totalPayout / totalTurnover) * 100 : 96.5;

    // Per game breakdown
    const gameStats = STUDIO_GAMES.map((g) => {
      const gRounds = roundsData.filter((r) => r.gameUid === g.game_uid);
      const bet = gRounds.reduce((acc, r) => acc + r.betAmount, 0);
      const win = gRounds.reduce((acc, r) => acc + r.winAmount, 0);
      return {
        gameUid: g.game_uid,
        name: g.name,
        category: g.category,
        configuredRtp: g.rtp,
        rounds: gRounds.length,
        turnover: bet,
        payout: win,
      };
    });

    return NextResponse.json({
      clientsCount,
      activeSessionsCount,
      totalRounds,
      totalTurnover,
      totalPayout,
      studioGgr,
      actualRtp: Number(actualRtp.toFixed(2)),
      gamesCount: STUDIO_GAMES.length,
      gameStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
