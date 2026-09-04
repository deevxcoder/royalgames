import { NextRequest, NextResponse } from "next/server";
import { tickAndGetABState } from "@/lib/serverAndarBaharEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = tickAndGetABState();

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
    console.error("Andar Bahar state fetch error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
