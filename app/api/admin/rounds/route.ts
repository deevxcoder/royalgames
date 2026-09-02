import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const game = searchParams.get("game");
    const search = searchParams.get("search");

    const where: any = {};
    if (game && game !== "all") {
      where.gameUid = game;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { serialNumber: { contains: q } },
        { userId: { contains: q } },
        { gameName: { contains: q } },
        { gameRound: { contains: q } },
      ];
    }

    const [totalCount, rounds, aggregate] = await Promise.all([
      db.gameRound.count({ where }),
      db.gameRound.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          operator: {
            select: { companyName: true },
          },
        },
      }),
      db.gameRound.aggregate({
        where,
        _sum: {
          betAmount: true,
          winAmount: true,
        },
      }),
    ]);

    const totalBets = aggregate._sum.betAmount || 0;
    const totalWins = aggregate._sum.winAmount || 0;
    const totalGgr = totalBets - totalWins;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      rounds: rounds.map((r) => {
        const rawMult =
          r.betAmount > 0
            ? Number((r.winAmount / r.betAmount).toFixed(2))
            : 0;

        return {
          id: r.id,
          roundId: r.gameRound || r.serialNumber,
          serialNumber: r.serialNumber,
          gameUid: r.gameUid,
          gameName: r.gameName,
          clientName: r.operator?.companyName || "Default Studio Client",
          userId: r.userId || r.memberAccount || "Player",
          betAmount: r.betAmount,
          winAmount: r.winAmount,
          multiplier: rawMult,
          createdAt: r.createdAt,
        };
      }),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
      stats: {
        totalBets,
        totalWins,
        totalGgr,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
