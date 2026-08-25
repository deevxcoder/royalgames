import { NextRequest, NextResponse } from "next/server";
import { tickAndGetState } from "@/lib/serverCrashEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameUid = searchParams.get("game") || "royal_skyrush";

    const state = tickAndGetState(gameUid);

    return NextResponse.json(
      {
        success: true,
        ...state,
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
