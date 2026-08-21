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
    const amount = Number(body.amount) || 10000;

    const operator = await db.operator.findUnique({
      where: { email: payload.username },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const newBalance = operator.balance + amount;

    await db.$transaction([
      db.operator.update({
        where: { id: operator.id },
        data: { balance: newBalance },
      }),
      db.operatorTransaction.create({
        data: {
          operatorId: operator.id,
          type: "DEMO_RECHARGE",
          amount: amount,
          balanceAfter: newBalance,
          description: `Instant Sandbox Demo Credit (+₹${amount.toLocaleString()})`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      amount,
      newBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
