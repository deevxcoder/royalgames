import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";
import { setGameRtpConfig, getGameRtpConfig } from "@/lib/serverCrashEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const setting = await db.siteSetting.findUnique({
      where: { id: "default" },
    });

    let gameRtpMap: Record<string, number> = {};
    if (setting?.enabledProviders) {
      try {
        const parsed = JSON.parse(setting.enabledProviders);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          gameRtpMap = parsed;
        }
      } catch (e) {}
    }

    const globalRtp = gameRtpMap["_global_rtp"] || 96.5;

    // Combine with STUDIO_GAMES
    const games = STUDIO_GAMES.map((g) => {
      const liveRtp = gameRtpMap[g.game_uid] !== undefined ? gameRtpMap[g.game_uid] : g.rtp;
      const houseEdge = Number((100 - liveRtp).toFixed(2));
      return {
        gameUid: g.game_uid,
        name: g.name,
        category: g.category,
        defaultRtp: g.rtp,
        liveRtp,
        houseEdge,
        maxMultiplier: g.max_multiplier,
        volatility: g.category.includes("Crash") || g.category.includes("Quantum") ? "High" : "Medium",
      };
    });

    return NextResponse.json({
      success: true,
      globalRtp,
      globalHouseEdge: Number((100 - globalRtp).toFixed(2)),
      games,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, globalRtp, gameUid, rtp } = body;

    const setting = await db.siteSetting.findUnique({
      where: { id: "default" },
    });

    let currentMap: Record<string, number> = {};
    if (setting?.enabledProviders) {
      try {
        const parsed = JSON.parse(setting.enabledProviders);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          currentMap = parsed;
        }
      } catch (e) {}
    }

    if (action === "SET_GLOBAL_ALL") {
      // Set global RTP for all games
      const targetRtp = Number(Math.max(80.0, Math.min(99.5, Number(globalRtp) || 96.5)).toFixed(2));
      currentMap["_global_rtp"] = targetRtp;
      STUDIO_GAMES.forEach((g) => {
        currentMap[g.game_uid] = targetRtp;
        setGameRtpConfig(g.game_uid, targetRtp);
      });
    } else if (action === "SET_SINGLE_GAME" && gameUid) {
      const targetRtp = Number(Math.max(80.0, Math.min(99.5, Number(rtp) || 96.5)).toFixed(2));
      currentMap[gameUid] = targetRtp;
      setGameRtpConfig(gameUid, targetRtp);
    }

    // Save to database
    await db.siteSetting.upsert({
      where: { id: "default" },
      update: {
        enabledProviders: JSON.stringify(currentMap),
      },
      create: {
        id: "default",
        enabledProviders: JSON.stringify(currentMap),
      },
    });

    return NextResponse.json({
      success: true,
      msg: "RTP & GGR settings updated successfully",
      savedMap: currentMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
