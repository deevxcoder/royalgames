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
    const playerId =
      body.user_id ||
      body.member_account ||
      body.userId ||
      body.username ||
      body.player_id ||
      body.playerId ||
      body.memberAccount ||
      body.user ||
      body.account;

    const playerBalance =
      typeof body.balance === "number"
        ? body.balance
        : typeof body.wallet === "number"
        ? body.wallet
        : typeof body.amount === "number"
        ? body.amount
        : Number(body.balance || body.wallet || body.amount || 1000);

    const game_uid = body.game_uid || body.gameUid || body.game || "royal_skyrush";
    const currency = body.currency || "INR";
    const callback_url = body.callback_url || body.callbackUrl || auth.client.callbackUrl;
    const return_url = body.return_url || body.returnUrl || "http://localhost:3000";

    if (!playerId) {
      return NextResponse.json(
        { status: 0, error: "Missing required parameter: user_id (or member_account / username)" },
        { status: 400 }
      );
    }

    const selectedGameUid = game_uid || "royal_skyrush";
    const gameMeta = STUDIO_GAMES.find((g) => g.game_uid === selectedGameUid);
    if (!gameMeta) {
      return NextResponse.json(
        { status: 0, error: `Invalid game_uid '${selectedGameUid}'. Valid games: ${STUDIO_GAMES.map(g => g.game_uid).join(", ")}` },
        { status: 404 }
      );
    }

    // Check operator prepaid GGR balance
    if (auth.client.balance <= 0) {
      return NextResponse.json(
        { status: 0, error: "Client prepaid GGR credit exhausted. Please recharge wallet in developer portal." },
        { status: 402 }
      );
    }

    // Check if operator disabled this game
    const isGameDisabled = await db.operatorGameToggle.findFirst({
      where: {
        operatorId: auth.client.id,
        gameUid: selectedGameUid,
        isEnabled: false,
      },
    });

    if (isGameDisabled) {
      return NextResponse.json(
        {
          status: 0,
          error: `Game '${selectedGameUid}' is currently disabled in your operator portal catalog.`,
        },
        { status: 403 }
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
        balance: playerBalance,
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
