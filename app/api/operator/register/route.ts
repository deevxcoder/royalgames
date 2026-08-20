import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signOperatorToken } from "@/lib/auth";
import { generateStudioApiKey } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, email, password } = body;

    if (!companyName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await db.operator.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Account already exists with this email" }, { status: 409 });
    }

    const { token, secretKey } = generateStudioApiKey();
    const passwordHash = hashPassword(password);

    const operator = await db.operator.create({
      data: {
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        balance: 10000.0, // Starting demo prepaid GGR credit
        currency: "INR",
        ggrRate: 10.0,
        status: "ACTIVE",
        tokens: {
          create: {
            token,
            secretKey,
            name: "Production Gateway Key",
            isLive: true,
          },
        },
      },
      include: {
        tokens: true,
      },
    });

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
        tokens: operator.tokens,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
