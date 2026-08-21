import { NextRequest, NextResponse } from "next/server";
import { authenticateStudioRequest } from "@/lib/studioAuth";
import { db } from "@/lib/db";

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
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ status: 0, error: "Missing session_id parameter" }, { status: 400 });
    }

    const session = await db.gameSession.findFirst({
      where: {
        sessionId: session_id,
        operatorId: auth.client.id,
      },
    });

    if (!session) {
      return NextResponse.json({ status: 0, error: "Game session not found" }, { status: 404 });
    }

    const isExpired = new Date() > new Date(session.expiresAt);

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Game session details verified",
      data: {
        session_id: session.sessionId,
        user_id: session.userId,
        game_uid: session.gameUid,
        balance: session.balance,
        currency: session.currency,
        status: isExpired ? "EXPIRED" : session.status,
        is_expired: isExpired,
        expires_at: session.expiresAt.toISOString(),
        created_at: session.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, error: err.message || "Internal server error" }, { status: 500 });
  }
}
