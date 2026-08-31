import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { callbackUrl } = body;

    const updated = await db.operator.update({
      where: { id: operator.id },
      data: { callbackUrl: callbackUrl ? String(callbackUrl).trim() : null },
    });

    return NextResponse.json({
      success: true,
      callbackUrl: updated.callbackUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
