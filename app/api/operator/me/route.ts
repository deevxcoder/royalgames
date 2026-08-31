import { NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [recentTransactions, recentRounds, recentWebhooks, totalStats] = await Promise.all([
      db.operatorTransaction.findMany({
        where: { operatorId: operator.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      db.gameRound.findMany({
        where: { operatorId: operator.id },
        include: {
          user: { select: { id: true, username: true } },
          session: { select: { id: true, userId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      db.webhookLog.findMany({
        where: { operatorId: operator.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      db.gameRound.aggregate({
        where: { operatorId: operator.id },
        _sum: { betAmount: true, winAmount: true, ggrFeeDeducted: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      operator: {
        id: operator.id,
        companyName: operator.companyName,
        email: operator.email,
        balance: operator.balance,
        currency: operator.currency,
        ggrRate: operator.ggrRate,
        isAdmin: operator.isAdmin,
        status: operator.status,
        callbackUrl: operator.callbackUrl,
        tokens: operator.tokens,
      },
      stats: {
        totalBetVolume: totalStats._sum.betAmount || 0,
        totalWinPayouts: totalStats._sum.winAmount || 0,
        totalGgrFees: totalStats._sum.ggrFeeDeducted || 0,
        totalRounds: totalStats._count.id || 0,
      },
      recentTransactions,
      recentRounds,
      recentWebhooks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch profile" }, { status: 500 });
  }
}
