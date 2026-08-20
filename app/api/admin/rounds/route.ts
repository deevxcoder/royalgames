import { NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rounds = await db.gameRound.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        operator: {
          select: { companyName: true },
        },
      },
    });

    return NextResponse.json({
      rounds: rounds.map((r) => ({
        id: r.id,
        serialNumber: r.serialNumber,
        gameUid: r.gameUid,
        gameName: r.gameName,
        clientName: r.operator?.companyName || "Default Studio Client",
        userId: r.userId || (r as any).memberAccount || "Player",
        betAmount: r.betAmount,
        winAmount: r.winAmount,
        multiplier: r.betAmount > 0 ? (r.winAmount / r.betAmount).toFixed(2) + "x" : "0x",
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
