import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || "all";
    const dateRange = searchParams.get("dateRange") || "all"; // today, 7d, 30d, all
    const gameUid = searchParams.get("gameUid") || "all";

    // Date filter clause
    let dateFilter: any = {};
    const now = new Date();
    if (dateRange === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (dateRange === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: sevenDaysAgo };
    } else if (dateRange === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: thirtyDaysAgo };
    }

    // Build Where Clause
    const whereClause: any = {};
    if (operatorId && operatorId !== "all") {
      whereClause.operatorId = operatorId;
    }
    if (gameUid && gameUid !== "all") {
      whereClause.gameUid = gameUid;
    }
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Fetch operators and rounds in parallel
    const [operators, rounds, allSessions] = await Promise.all([
      db.operator.findMany({
        orderBy: { companyName: "asc" },
        select: {
          id: true,
          companyName: true,
          email: true,
          balance: true,
          currency: true,
          ggrRate: true,
          status: true,
        },
      }),
      db.gameRound.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          operator: {
            select: { id: true, companyName: true, ggrRate: true, currency: true },
          },
        },
      }),
      db.gameSession.findMany({
        where: operatorId && operatorId !== "all" ? { operatorId } : {},
        select: { userId: true, operatorId: true },
      }),
    ]);

    // Financial KPI Totals
    const totalTurnover = rounds.reduce((acc, r) => acc + (r.betAmount || 0), 0);
    const totalPayout = rounds.reduce((acc, r) => acc + (r.winAmount || 0), 0);
    const totalGgr = totalTurnover - totalPayout;
    const totalStudioRevenue = rounds.reduce((acc, r) => acc + (r.ggrFeeDeducted || 0), 0);
    const totalRounds = rounds.length;

    // Unique players count
    const uniqueUserIds = new Set(rounds.map((r) => r.userId).filter(Boolean));
    const uniquePlayersCount = uniqueUserIds.size;

    // Operator-wise financial breakdown
    const operatorBreakdown = operators.map((op) => {
      const opRounds = rounds.filter((r) => r.operatorId === op.id);
      const turnover = opRounds.reduce((acc, r) => acc + (r.betAmount || 0), 0);
      const payout = opRounds.reduce((acc, r) => acc + (r.winAmount || 0), 0);
      const ggr = turnover - payout;
      const studioFee = opRounds.reduce((acc, r) => acc + (r.ggrFeeDeducted || 0), 0);
      const opPlayers = new Set(opRounds.map((r) => r.userId).filter(Boolean)).size;

      return {
        operatorId: op.id,
        name: op.companyName,
        email: op.email,
        currency: op.currency || "INR",
        balance: op.balance,
        ggrRate: op.ggrRate,
        status: op.status,
        roundsCount: opRounds.length,
        playersCount: opPlayers,
        turnover: Number(turnover.toFixed(2)),
        payout: Number(payout.toFixed(2)),
        ggr: Number(ggr.toFixed(2)),
        studioFee: Number(studioFee.toFixed(2)),
        margin: turnover > 0 ? Number(((ggr / turnover) * 100).toFixed(1)) : 0,
      };
    });

    // Game-wise distribution for current filter
    const gameDistribution = STUDIO_GAMES.map((g) => {
      const gRounds = rounds.filter((r) => r.gameUid === g.game_uid);
      const turnover = gRounds.reduce((acc, r) => acc + (r.betAmount || 0), 0);
      const payout = gRounds.reduce((acc, r) => acc + (r.winAmount || 0), 0);
      const ggr = turnover - payout;
      const ggrFee = gRounds.reduce((acc, r) => acc + (r.ggrFeeDeducted || 0), 0);

      return {
        gameUid: g.game_uid,
        name: g.name,
        category: g.category,
        rtp: g.rtp,
        rounds: gRounds.length,
        turnover: Number(turnover.toFixed(2)),
        payout: Number(payout.toFixed(2)),
        ggr: Number(ggr.toFixed(2)),
        ggrFee: Number(ggrFee.toFixed(2)),
      };
    }).filter((g) => g.rounds > 0 || gameUid === "all");

    // Player-wise breakdown (top 20 players in filtered data)
    const playerMap: Record<string, { userId: string; operatorName: string; rounds: number; turnover: number; payout: number; netPnl: number }> = {};

    rounds.forEach((r) => {
      const uId = r.userId || "guest_player";
      if (!playerMap[uId]) {
        playerMap[uId] = {
          userId: uId,
          operatorName: r.operator?.companyName || "Direct Studio",
          rounds: 0,
          turnover: 0,
          payout: 0,
          netPnl: 0,
        };
      }
      playerMap[uId].rounds += 1;
      playerMap[uId].turnover += r.betAmount || 0;
      playerMap[uId].payout += r.winAmount || 0;
      playerMap[uId].netPnl += (r.winAmount || 0) - (r.betAmount || 0);
    });

    const topPlayers = Object.values(playerMap)
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 25)
      .map((p) => ({
        ...p,
        turnover: Number(p.turnover.toFixed(2)),
        payout: Number(p.payout.toFixed(2)),
        netPnl: Number(p.netPnl.toFixed(2)),
      }));

    return NextResponse.json({
      success: true,
      filter: { operatorId, dateRange, gameUid },
      summary: {
        totalTurnover: Number(totalTurnover.toFixed(2)),
        totalPayout: Number(totalPayout.toFixed(2)),
        totalGgr: Number(totalGgr.toFixed(2)),
        totalStudioRevenue: Number(totalStudioRevenue.toFixed(2)),
        totalRounds,
        uniquePlayersCount,
        holdMargin: totalTurnover > 0 ? Number(((totalGgr / totalTurnover) * 100).toFixed(2)) : 0,
      },
      operators: operators.map((o) => ({ id: o.id, name: o.companyName })),
      operatorBreakdown,
      gameDistribution,
      topPlayers,
    });
  } catch (error: any) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
