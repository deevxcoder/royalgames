import { NextRequest, NextResponse } from "next/server";
import { authenticateStudioRequest } from "@/lib/studioAuth";
import { signSessionToken } from "@/lib/auth";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudioRequest(req);
    if (!auth.valid) {
      return NextResponse.json(
        { status: 0, error: auth.error || "Unauthorized Studio API Access" },
        { status: auth.statusCode || 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      user_id,
      member_account,
      game_uid,
      balance = 1000,
      currency = "INR",
      callback_url,
      return_url = "http://localhost:3000",
    } = body;

    const playerId = user_id || member_account;
    if (!playerId) {
      return NextResponse.json(
        { status: 0, error: "Missing required parameter: user_id (or member_account)" },
        { status: 400 }
      );
    }

    const selectedGameUid = game_uid || "royal_coinflip";
    const gameMeta = STUDIO_GAMES.find((g) => g.game_uid === selectedGameUid);
    if (!gameMeta) {
      return NextResponse.json(
        { status: 0, error: `Invalid game_uid '${selectedGameUid}'. Valid games: ${STUDIO_GAMES.map(g => g.game_uid).join(", ")}` },
        { status: 404 }
      );
    }

    const rawSessionId = `sess_${crypto.randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 hours

    // Record session in database
    const sessionRecord = await db.gameSession.create({
      data: {
        sessionId: rawSessionId,
        operatorId: auth.client.id,
        userId: String(playerId),
        gameUid: selectedGameUid,
        balance: Number(balance) || 1000,
        currency: String(currency).toUpperCase(),
        callbackUrl: callback_url || auth.client.callbackUrl || "http://localhost:3001/api/v1/round/resolve",
        returnUrl: return_url,
        status: "ACTIVE",
        expiresAt,
      },
    });

    const sessionJwt = signSessionToken({
      sessionId: sessionRecord.sessionId,
      operatorId: auth.client.id,
      userId: sessionRecord.userId,
      gameUid: sessionRecord.gameUid,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
    const launchUrl = `${appUrl}/play/${sessionRecord.sessionId}?token=${sessionJwt}&game=${selectedGameUid}&returnUrl=${encodeURIComponent(
      return_url
    )}`;

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Royal Studio game session created successfully",
      data: {
        session_id: sessionRecord.sessionId,
        game_uid: selectedGameUid,
        game_name: gameMeta.name,
        provider: "Royal Games Studio",
        launch_url: launchUrl,
        client_name: auth.client.companyName,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Studio Launch API Error:", err);
    return NextResponse.json({ status: 0, error: err.message || "Internal server error" }, { status: 500 });
  }
}
