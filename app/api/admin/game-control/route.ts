import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import {
  getAllGameOverrides,
  setCrashGameOverride,
  setAndarBaharOverride,
  clearGameOverride,
  resetAllGameOverrides,
} from "@/lib/gameControlManager";
import { tickAndGetState } from "@/lib/serverCrashEngine";
import { tickAndGetABState } from "@/lib/serverAndarBaharEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getStudioAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Studio Admin" }, { status: 401 });
    }

    const overrides = getAllGameOverrides();

    // Query live tick states for context
    const skyRushLive = tickAndGetState("royal_skyrush");
    const cricketBlastLive = tickAndGetState("royal_cricketblast");
    const andarBaharLive = tickAndGetABState();

    return NextResponse.json({
      success: true,
      overrides,
      liveStatus: {
        royal_skyrush: {
          phase: skyRushLive.phase,
          currentMultiplier: skyRushLive.currentMultiplier,
          crashMultiplier: skyRushLive.crashMultiplier,
          countdownLeft: skyRushLive.countdownLeft,
          roundId: skyRushLive.roundId,
        },
        royal_cricketblast: {
          phase: cricketBlastLive.phase,
          currentMultiplier: cricketBlastLive.currentMultiplier,
          crashMultiplier: cricketBlastLive.crashMultiplier,
          countdownLeft: cricketBlastLive.countdownLeft,
          roundId: cricketBlastLive.roundId,
        },
        royal_andarbahar: {
          phase: andarBaharLive.phase,
          winningSide: andarBaharLive.winningSide,
          predictedWinner: andarBaharLive.predictedWinner || andarBaharLive.winningSide,
          jokerCard: andarBaharLive.jokerCard?.display,
          countdownLeft: andarBaharLive.countdownLeft,
          roundId: andarBaharLive.roundId,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getStudioAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Studio Admin" }, { status: 401 });
    }

    const body = await req.json();
    const { action, gameUid, forcedMultiplier, forcedWinner, roundsRemaining, label } = body;

    if (action === "SET_CRASH_OVERRIDE") {
      if (!gameUid || !forcedMultiplier) {
        return NextResponse.json({ error: "Missing gameUid or forcedMultiplier" }, { status: 400 });
      }
      const updated = setCrashGameOverride(
        gameUid as any,
        Number(forcedMultiplier),
        Number(roundsRemaining) || 1,
        label
      );
      return NextResponse.json({
        success: true,
        message: `Forced crash multiplier set to ${forcedMultiplier}x for ${gameUid}`,
        override: updated,
      });
    }

    if (action === "SET_AB_OVERRIDE") {
      if (!forcedWinner || !["ANDAR", "BAHAR"].includes(forcedWinner)) {
        return NextResponse.json({ error: "Invalid forcedWinner (must be ANDAR or BAHAR)" }, { status: 400 });
      }
      const updated = setAndarBaharOverride(
        forcedWinner as any,
        Number(roundsRemaining) || 1,
        label
      );
      return NextResponse.json({
        success: true,
        message: `Forced winning side set to ${forcedWinner} for Andar Bahar Royale`,
        override: updated,
      });
    }

    if (action === "CLEAR_GAME" && gameUid) {
      clearGameOverride(gameUid);
      return NextResponse.json({
        success: true,
        message: `Override cleared for ${gameUid}. Reverted to Auto RNG.`,
      });
    }

    if (action === "RESET_ALL") {
      resetAllGameOverrides();
      return NextResponse.json({
        success: true,
        message: "All 3 games reset to clean Auto RNG mode successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
