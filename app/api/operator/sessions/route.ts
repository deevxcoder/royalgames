import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Number(searchParams.get("limit")) || 50);

    const [sessions, rounds] = await Promise.all([
      db.gameSession.findMany({
        where: { operatorId: operator.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.gameRound.findMany({
        where: { operatorId: operator.id },
        include: {
          user: { select: { id: true, username: true } },
          session: { select: { id: true, userId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      rounds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch sessions" }, { status: 500 });
  }
}
