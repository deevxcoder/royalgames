import { NextRequest, NextResponse } from "next/server";
import { tickAndGetState } from "@/lib/serverCrashEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameUid = searchParams.get("game") || "royal_skyrush";

    const state = tickAndGetState(gameUid);

    // ZERO-LEAK SECURITY RULE:
    // During COUNTDOWN phase (while bets are still being placed), NEVER expose future crash outcome!
    // Result is strictly kept hidden until bets are locked and flight begins.
    const isBettingPhase = state.phase === "COUNTDOWN";
    const sanitizedState = {
      ...state,
      crashMultiplier: isBettingPhase ? null : state.crashMultiplier,
      crashTime: isBettingPhase ? null : state.crashTime,
      flightDurationMs: isBettingPhase ? null : state.flightDurationMs,
    };

    return NextResponse.json(
      {
        success: true,
        ...sanitizedState,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Multiplayer state fetch error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
