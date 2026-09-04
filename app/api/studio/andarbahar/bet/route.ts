import { NextRequest, NextResponse } from "next/server";
import { recordABBet, tickAndGetABState } from "@/lib/serverAndarBaharEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { side, amount, username } = body;

    if (!side || !["ANDAR", "BAHAR"].includes(side)) {
      return NextResponse.json({ success: false, error: "Invalid side. Must be ANDAR or BAHAR" }, { status: 400 });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid bet amount" }, { status: 400 });
    }

    const state = tickAndGetABState();
    if (state.phase !== "BETTING") {
      return NextResponse.json({ success: false, error: "Betting closed for this round" }, { status: 400 });
    }

    recordABBet(side, amount, username || "Player");

    return NextResponse.json({
      success: true,
      message: `Bet of ₹${amount} recorded on ${side}`,
    });
  } catch (err: any) {
    console.error("Andar Bahar record bet error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
