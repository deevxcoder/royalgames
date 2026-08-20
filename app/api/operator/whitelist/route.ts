import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tokenId, ipWhitelist } = body;

    if (!tokenId) {
      return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
    }

    const updated = await db.apiToken.update({
      where: { id: tokenId, operatorId: operator.id },
      data: { ipWhitelist: ipWhitelist ? String(ipWhitelist).trim() : null },
    });

    return NextResponse.json({
      success: true,
      token: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update IP whitelist" }, { status: 500 });
  }
}
