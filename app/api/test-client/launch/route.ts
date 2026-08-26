import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signSessionToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      playerId = "player_rahul",
      gameUid = "royal_skyrush",
      balance = 5000,
      currency = "INR",
    } = body;

    // Ensure at least one test operator exists in database
    let operator = await db.operator.findFirst({
      where: { email: "test-casino@royalgames.com" },
    });

    if (!operator) {
      operator = await db.operator.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!operator) {
      operator = await db.operator.create({
        data: {
          companyName: "Nexus Test Casino",
          email: "test-casino@royalgames.com",
          passwordHash: crypto.createHash("sha256").update("test1234").digest("hex"),
          balance: 100000.0,
          currency: "INR",
          ggrRate: 10.0,
          isAdmin: false,
          status: "ACTIVE",
          callbackUrl: "http://localhost:3000/api/test-client/callback",
        },
      });
    }

    const rawSessionId = `sess_test_${playerId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 hours

    const origin = req.nextUrl?.origin || (req.headers.get("host") ? `http://${req.headers.get("host")}` : null) || "http://localhost:3000";
    const callbackUrl = `${origin}/api/test-client/callback`;
    const returnUrl = `${origin}/test-casino`;

    // Create session in DB
    const sessionRecord = await db.gameSession.create({
      data: {
        sessionId: rawSessionId,
        operatorId: operator.id,
        userId: playerId,
        gameUid,
        balance: Number(balance) || 5000,
        currency,
        callbackUrl,
        returnUrl,
        status: "ACTIVE",
        expiresAt,
      },
    });

    const sessionJwt = signSessionToken({
      sessionId: sessionRecord.sessionId,
      operatorId: operator.id,
      userId: sessionRecord.userId,
      gameUid: sessionRecord.gameUid,
    });

    const launchUrl = `${origin}/play/${sessionRecord.sessionId}?token=${sessionJwt}&game=${gameUid}&returnUrl=${encodeURIComponent(
      returnUrl
    )}`;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionRecord.sessionId,
        playerId,
        gameUid,
        balance: sessionRecord.balance,
        launchUrl,
        callbackUrl,
      },
    });
  } catch (err: any) {
    console.error("Test Client Launch Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
