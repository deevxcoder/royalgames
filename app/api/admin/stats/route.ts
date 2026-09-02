import { NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [clientsCount, activeSessionsCount, totalRounds, pendingDepositsCount, aggregate] =
      await Promise.all([
        db.operator.count(),
        db.gameSession.count({ where: { status: "ACTIVE" } }),
        db.gameRound.count(),
        db.operatorDepositRequest.count({ where: { status: "PENDING" } }),
        db.gameRound.aggregate({
          _sum: {
            betAmount: true,
            winAmount: true,
            ggrFeeDeducted: true,
          },
        }),
      ]);

    const totalTurnover = aggregate._sum.betAmount || 0;
    const totalPayout = aggregate._sum.winAmount || 0;
    const studioGgr = totalTurnover - totalPayout;
    const totalStudioFee = aggregate._sum.ggrFeeDeducted || studioGgr * 0.1;
    const actualRtp = totalTurnover > 0 ? (totalPayout / totalTurnover) * 100 : 96.5;

    const statsPayload = {
      clientsCount,
      activeSessionsCount,
      totalRounds,
      pendingDepositsCount,
      totalTurnover,
      totalPayout,
      studioGgr,
      totalStudioFee,
      actualRtp: Number(actualRtp.toFixed(2)),
      gamesCount: STUDIO_GAMES.length,
    };

    return NextResponse.json({
      success: true,
      stats: statsPayload,
      ...statsPayload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
