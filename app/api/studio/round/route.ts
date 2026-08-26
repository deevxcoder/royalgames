import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";
import { dispatchWebhookCallback } from "@/lib/webhook";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      sessionToken,
      gameUid = "royal_skyrush",
      betAmount = 0,
      winAmount = 0,
      multiplier = 0,
      currentBalance = 1000,
      extraData = {},
    } = body;

    const bet = Number(betAmount) || 0;
    const win = Number(winAmount) || 0;
    const mult = Number(multiplier) || (bet > 0 ? Number((win / bet).toFixed(2)) : 0);

    const gameMeta = STUDIO_GAMES.find((g) => g.game_uid === gameUid) || {
      game_id: 88801,
      name: gameUid,
      game_uid: gameUid,
    };

    // Look for matching GameSession in Database
    let session = null;
    if (sessionId && sessionId !== "sess_demo") {
      session = await db.gameSession.findUnique({
        where: { sessionId },
        include: {
          operator: true,
        },
      });
    }

    // If session not found by ID, try token decode
    if (!session && sessionToken) {
      const decoded = verifySessionToken(sessionToken);
      if (decoded?.sessionId) {
        session = await db.gameSession.findUnique({
          where: { sessionId: decoded.sessionId },
          include: { operator: true },
        });
      }
    }

    // Generate unique serial number (Idempotency Key)
    const serialNumber = `SN_ROYAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    let newBalance = 0;
    let operatorId = session?.operatorId || null;
    let userId = session?.userId || "player_demo";
    let callbackUrl = session?.callbackUrl || session?.operator?.callbackUrl || null;
    let ggrFeeDeducted = 0;

    if (session) {
      // Validate game is not deactivated for this operator
      const isGameDisabled = await db.operatorGameToggle.findFirst({
        where: {
          OR: [
            { operatorId: session.operatorId, isEnabled: false },
            { operator: { isAdmin: true }, isEnabled: false },
          ],
          gameUid,
        },
      });

      if (isGameDisabled) {
        return NextResponse.json(
          {
            success: false,
            error: `Game '${gameUid}' is deactivated for this operator.`,
          },
          { status: 403 }
        );
      }

      // Calculate authoritative new balance from session
      newBalance = Number(Math.max(0, session.balance - bet + win).toFixed(2));

      // Update session balance
      await db.gameSession.update({
        where: { id: session.id },
        data: { balance: newBalance },
      });

      // Calculate GGR Fee (operator revenue share on GGR = Bet - Win)
      const ggrRate = session.operator?.ggrRate || 10.0;
      const ggrAmount = bet - win;
      if (ggrAmount > 0) {
        ggrFeeDeducted = Number(((ggrAmount * ggrRate) / 100).toFixed(2));
      }

      // Deduct GGR fee from operator prepaid balance if applicable
      if (ggrFeeDeducted > 0 && session.operator) {
        await db.operator.update({
          where: { id: session.operator.id },
          data: {
            balance: {
              decrement: ggrFeeDeducted,
            },
          },
        });
      }
    } else {
      // Demo / Guest mode
      newBalance = Number(Math.max(0, currentBalance - bet + win).toFixed(2));
      
      // Fallback: If any operator exists in database, link demo rounds to first operator so admin sees activity
      const firstOperator = await db.operator.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (firstOperator) {
        operatorId = firstOperator.id;
      }
    }

    // Check if a local user exists with this ID before linking memberAccount foreign key
    let localUserId: string | null = null;
    try {
      const localUser = await db.user.findUnique({ where: { id: userId } });
      if (localUser) localUserId = localUser.id;
    } catch {}

    // Record GameRound in database
    const roundRecord = await db.gameRound.create({
      data: {
        serialNumber,
        sessionId: session?.id || null,
        operatorId: operatorId || null,
        userId: userId,
        memberAccount: localUserId,
        gameId: gameMeta.game_id,
        gameUid: gameMeta.game_uid,
        gameName: gameMeta.name,
        betAmount: bet,
        winAmount: win,
        creditAmount: newBalance,
        ggrFeeDeducted,
        rawPayload: JSON.stringify({
          betAmount: bet,
          winAmount: win,
          multiplier: mult,
          extraData,
          sessionBalanceBefore: session?.balance ?? currentBalance,
          sessionBalanceAfter: newBalance,
        }),
      },
    });

    // Dispatch webhook to client casino if callback URL is configured
    let webhookResult = null;
    if (callbackUrl) {
      webhookResult = await dispatchWebhookCallback(
        operatorId || null,
        session?.id || null,
        callbackUrl,
        {
          game_id: gameMeta.game_id,
          game_uid: gameMeta.game_uid,
          game_round: serialNumber,
          member_account: userId,
          bet_amount: bet,
          win_amount: win,
          credit_amount: newBalance,
          serial_number: serialNumber,
          game_name: gameMeta.name,
          timestamp: Date.now(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      serialNumber,
      betAmount: bet,
      winAmount: win,
      multiplier: mult,
      newBalance,
      roundId: roundRecord.id,
      webhookDispatched: !!callbackUrl,
      webhookSuccess: webhookResult?.success ?? null,
    });
  } catch (err: any) {
    console.error("Studio Round Execution Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal error" }, { status: 500 });
  }
}
