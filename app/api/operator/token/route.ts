import { NextRequest, NextResponse } from "next/server";
import { getCurrentOperator } from "@/lib/auth";
import { generateStudioApiKey } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const operator = await getCurrentOperator();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name = "Production Gateway Key", ipWhitelist = null } = body;

    const { token, secretKey } = generateStudioApiKey();

    const createdToken = await db.apiToken.create({
      data: {
        operatorId: operator.id,
        token,
        secretKey,
        name,
        isLive: true,
        ipWhitelist: ipWhitelist || null,
      },
    });

    return NextResponse.json({
      success: true,
      token: createdToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate token" }, { status: 500 });
  }
}
