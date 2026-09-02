import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search")?.trim();

    const whereRound: any = { operatorId: operator.id };
    if (search) {
      whereRound.OR = [
        { roundId: { contains: search } },
        { serialNumber: { contains: search } },
        { userId: { contains: search } },
        { gameName: { contains: search } },
      ];
    }

    const [totalRounds, sessions, rounds] = await Promise.all([
      db.gameRound.count({ where: whereRound }),
      db.gameSession.findMany({
        where: { operatorId: operator.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.gameRound.findMany({
        where: whereRound,
        include: {
          user: { select: { id: true, username: true } },
          session: { select: { id: true, userId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalRounds / limit) || 1;

    return NextResponse.json({
      success: true,
      sessions,
      rounds,
      pagination: {
        page,
        limit,
        totalRounds,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch sessions" }, { status: 500 });
  }
}
