import { NextRequest, NextResponse } from "next/server";
import { authenticateStudioRequest } from "@/lib/studioAuth";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudioRequest(req);
    if (!auth.valid) {
      return NextResponse.json(
        { status: 0, error: auth.error || "Unauthorized" },
        { status: auth.statusCode || 401 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";

    const formattedGames = STUDIO_GAMES.map((g) => ({
      game_id: g.game_id,
      game_uid: g.game_uid,
      game_name: g.name,
      name: g.name,
      provider: "Royal Games Studio",
      brand_name: "Royal Games Studio",
      brand_id: 1,
      category: g.category,
      rtp: g.rtp,
      max_multiplier: `${g.max_multiplier}x`,
      thumbnail: `${appUrl}/games/${g.game_uid}.svg`,
      banner: `${appUrl}/games/${g.game_uid}.svg`,
      logo: `${appUrl}/games/${g.game_uid}.svg`,
      description: g.description,
      is_native: true,
      is_active: true,
    }));

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Royal Games Studio Catalog",
      count: formattedGames.length,
      data: {
        games: formattedGames,
        total: formattedGames.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, error: err.message || "Internal server error" }, { status: 500 });
  }
}
