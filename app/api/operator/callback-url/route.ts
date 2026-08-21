import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudioAdminToken } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("operator_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyStudioAdminToken(token);
    if (!payload || !payload.username) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { callbackUrl } = body;

    const operator = await db.operator.update({
      where: { email: payload.username },
      data: { callbackUrl: callbackUrl || null },
    });

    return NextResponse.json({
      success: true,
      callbackUrl: operator.callbackUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
