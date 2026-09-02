import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

const DEFAULT_LIMITS: Record<string, { minBet: number; maxBet: number; maxWinCap: number; maxRoundLiability: number }> = {
  royal_skyrush: { minBet: 20, maxBet: 25000, maxWinCap: 500000, maxRoundLiability: 500000 },
  royal_cricketblast: { minBet: 20, maxBet: 25000, maxWinCap: 500000, maxRoundLiability: 500000 },
  royal_andarbahar: { minBet: 50, maxBet: 25000, maxWinCap: 50000, maxRoundLiability: 100000 },
};

async function resolveOperator(req: NextRequest) {
  // 1. Try Cookie Session
  let operator = await getCurrentOperator();
  if (operator) return operator;

  // 2. Try Authorization Bearer header
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.replace("Bearer ", "").trim();
    const tokenRecord = await db.apiToken.findUnique({
      where: { token: rawKey },
      include: {
        operator: {
          include: {
            tokens: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (tokenRecord?.operator) return tokenRecord.operator;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const operator = await resolveOperator(req);
    if (!operator) {
      return NextResponse.json({ success: false, error: "Unauthorized operator access" }, { status: 401 });
    }

    const savedLimits = await db.operatorGameLimit.findMany({
      where: { operatorId: operator.id },
    });

    const limitsMap: Record<string, any> = {};
    for (const g of STUDIO_GAMES) {
      const saved = savedLimits.find((l) => l.gameUid === g.game_uid);
      const fallback = DEFAULT_LIMITS[g.game_uid] || {
        minBet: 20,
        maxBet: 25000,
        maxWinCap: 500000,
        maxRoundLiability: 500000,
      };

      limitsMap[g.game_uid] = {
        gameUid: g.game_uid,
        name: g.name,
        category: g.category,
        minBet: saved ? saved.minBet : fallback.minBet,
        maxBet: saved ? saved.maxBet : fallback.maxBet,
        maxWinCap: saved ? saved.maxWinCap : fallback.maxWinCap,
        maxRoundLiability: saved ? saved.maxRoundLiability : fallback.maxRoundLiability,
      };
    }

    return NextResponse.json({
      success: true,
      operatorId: operator.id,
      companyName: operator.companyName,
      limits: limitsMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const operator = await resolveOperator(req);
    if (!operator) {
      return NextResponse.json({ success: false, error: "Unauthorized operator access" }, { status: 401 });
    }

    const body = await req.json();
    const { limits } = body;

    if (!limits || typeof limits !== "object") {
      return NextResponse.json({ success: false, error: "Invalid limits payload" }, { status: 400 });
    }

    const updatedResults: Record<string, any> = {};

    for (const [gameUid, limitData] of Object.entries(limits as Record<string, any>)) {
      const minBet = Math.max(1, Number(limitData.minBet) || 20);
      const maxBet = Math.max(minBet, Number(limitData.maxBet) || 25000);
      const maxWinCap = Math.max(maxBet, Number(limitData.maxWinCap) || 500000);
      const maxRoundLiability = Math.max(maxBet, Number(limitData.maxRoundLiability) || 500000);

      const record = await db.operatorGameLimit.upsert({
        where: {
          operatorId_gameUid: {
            operatorId: operator.id,
            gameUid,
          },
        },
        update: {
          minBet,
          maxBet,
          maxWinCap,
          maxRoundLiability,
        },
        create: {
          operatorId: operator.id,
          gameUid,
          minBet,
          maxBet,
          maxWinCap,
          maxRoundLiability,
        },
      });

      updatedResults[gameUid] = record;
    }

    return NextResponse.json({
      success: true,
      msg: "Game risk & bet limits updated successfully",
      limits: updatedResults,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
