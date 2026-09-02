import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const token = searchParams.get("token");
    const requestedGame = searchParams.get("game");

    const isDemoSession =
      !sessionId ||
      sessionId === "sess_demo" ||
      sessionId === "demo_session" ||
      sessionId.startsWith("demo_") ||
      sessionId.startsWith("sess_demo");

    // Fetch dynamic live RTP settings from database
    let liveRtp = 96.0;
    let rtpMap: Record<string, number> = {};
    try {
      const setting = await db.siteSetting.findUnique({ where: { id: "default" } });
      if (setting?.enabledProviders) {
        rtpMap = JSON.parse(setting.enabledProviders);
      }
    } catch (e) {}

    const globalRtp = rtpMap["_global_rtp"] || 96.0;
    const targetGame = requestedGame || "royal_skyrush";
    liveRtp = rtpMap[targetGame] !== undefined ? rtpMap[targetGame] : globalRtp;

    if (isDemoSession) {
      return NextResponse.json({
        success: true,
        isDemo: true,
        balance: 1000.0,
        currency: "INR",
        userId: "demo_player",
        clientName: "Demo Casino Player",
        gameUid: targetGame,
        liveRtp,
        globalRtp,
        rtpMap,
      });
    }

    // Try finding in database
    const session = await db.gameSession.findUnique({
      where: { sessionId },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            currency: true,
          },
        },
      },
    });

    if (session) {
      const isExpired = new Date() > new Date(session.expiresAt);

      // Verify if game has been disabled by operator or master admin
      const isGameDisabled = await db.operatorGameToggle.findFirst({
        where: {
          OR: [
            { operatorId: session.operatorId, isEnabled: false },
            { operator: { isAdmin: true }, isEnabled: false },
          ],
          gameUid: session.gameUid,
        },
      });

      if (isGameDisabled) {
        return NextResponse.json(
          {
            success: false,
            error: `Game '${session.gameUid}' is currently deactivated by the casino operator.`,
            isDeactivated: true,
          },
          { status: 403 }
        );
      }

      // Fetch operator configured limits for this game
      const targetGameUid = session.gameUid || requestedGame || "royal_skyrush";
      const opLimit = await db.operatorGameLimit.findUnique({
        where: {
          operatorId_gameUid: {
            operatorId: session.operatorId,
            gameUid: targetGameUid,
          },
        },
      });

      const limits = {
        minBet: opLimit?.minBet ?? (targetGameUid === "royal_andarbahar" ? 50 : 20),
        maxBet: opLimit?.maxBet ?? 25000,
        maxWinCap: opLimit?.maxWinCap ?? (targetGameUid === "royal_andarbahar" ? 50000 : 500000),
        maxRoundLiability: opLimit?.maxRoundLiability ?? (targetGameUid === "royal_andarbahar" ? 100000 : 500000),
      };

      return NextResponse.json({
        success: true,
        isDemo: false,
        sessionId: session.sessionId,
        userId: session.userId,
        balance: session.balance,
        currency: session.currency || "INR",
        gameUid: targetGameUid,
        clientName: session.operator?.companyName || "Royal Client",
        operatorId: session.operatorId,
        isExpired,
        liveRtp,
        globalRtp,
        rtpMap,
        limits,
      });
    }

    // If token is present, try decoding
    if (token) {
      const decoded = verifySessionToken(token);
      if (decoded) {
        return NextResponse.json({
          success: true,
          isDemo: false,
          sessionId: decoded.sessionId,
          userId: decoded.userId,
          balance: 1000.0,
          currency: "INR",
          gameUid: decoded.gameUid || requestedGame || "royal_skyrush",
          clientName: "Royal Client",
          liveRtp,
          globalRtp,
          rtpMap,
        });
      }
    }

    return NextResponse.json({
      success: true,
      isDemo: true,
      balance: 1000.0,
      currency: "INR",
      userId: "guest_player",
      clientName: "Guest",
      gameUid: requestedGame || "royal_skyrush",
    });
  } catch (error: any) {
    console.error("Error fetching studio session:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
