import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signOperatorToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const operator = await db.operator.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        tokens: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!operator) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = comparePassword(password, operator.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (operator.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your operator account has been suspended by Studio Admin" }, { status: 403 });
    }

    const jwtToken = signOperatorToken({ operatorId: operator.id, email: operator.email });
    const cookieStore = await cookies();
    cookieStore.set("royal_operator_token", jwtToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      operator: {
        id: operator.id,
        companyName: operator.companyName,
        email: operator.email,
        balance: operator.balance,
        currency: operator.currency,
        ggrRate: operator.ggrRate,
        isAdmin: operator.isAdmin,
        tokens: operator.tokens,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
