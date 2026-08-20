import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toggles = await db.operatorGameToggle.findMany({
      where: { operatorId: operator.id },
    });

    const disabledUids = toggles.filter((t) => !t.isEnabled).map((t) => t.gameUid);

    return NextResponse.json({
      success: true,
      toggles,
      disabledUids,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load game toggles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameUid, isEnabled } = body;

    if (!gameUid) {
      return NextResponse.json({ error: "Missing gameUid" }, { status: 400 });
    }

    const toggle = await db.operatorGameToggle.upsert({
      where: {
        operatorId_gameUid: {
          operatorId: operator.id,
          gameUid: String(gameUid),
        },
      },
      update: {
        isEnabled: Boolean(isEnabled),
        updatedAt: new Date(),
      },
      create: {
        operatorId: operator.id,
        gameUid: String(gameUid),
        isEnabled: Boolean(isEnabled),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Game ${gameUid} is now ${toggle.isEnabled ? "ENABLED" : "DISABLED"} for your casino`,
      toggle,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to toggle game" }, { status: 500 });
  }
}
