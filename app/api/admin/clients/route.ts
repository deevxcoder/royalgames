import { NextResponse } from "next/server";
import { getStudioAdmin, generateStudioApiKey, hashPassword } from "@/lib/studioAuth";
import { sendClientWelcomeEmail } from "@/lib/emailService";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clients = await db.operator.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tokens: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            sessions: true,
            rounds: true,
          },
        },
      },
    });

    return NextResponse.json({
      clients: clients.map((c) => ({
        id: c.id,
        name: c.companyName,
        email: c.email,
        status: c.status,
        isAdmin: c.isAdmin || c.email === "admin@royalggr.com",
        callbackUrl: c.callbackUrl,
        balance: c.balance,
        currency: c.currency,
        ggrRate: c.ggrRate,
        sessionsCount: c._count.sessions,
        roundsCount: c._count.rounds,
        tokens: c.tokens.map((t) => ({
          id: t.id,
          name: t.name,
          token: t.token,
          secretKey: t.secretKey,
          isLive: t.isLive,
          ipWhitelist: t.ipWhitelist,
          createdAt: t.createdAt,
        })),
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, password, callbackUrl, ipWhitelist, ggrRate = 10.0 } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Company name and email are required" }, { status: 400 });
    }

    const existing = await db.operator.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: "A client with this email already exists" }, { status: 400 });
    }

    const rawPassword = password?.trim() || `RGS_${Math.random().toString(36).slice(-6)}!99`;
    const { token, secretKey } = generateStudioApiKey();
    const passwordHash = hashPassword(rawPassword);

    const client = await db.operator.create({
      data: {
        companyName: name,
        email,
        passwordHash,
        callbackUrl: callbackUrl || "http://localhost:3001/api/v1/round/resolve",
        status: "ACTIVE",
        ggrRate: Number(ggrRate) || 10.0,
        tokens: {
          create: {
            token,
            secretKey,
            name: "Primary Production Key",
            isLive: true,
            ipWhitelist: ipWhitelist || null,
          },
        },
      },
      include: { tokens: true },
    });

    // Send Welcome Email asynchronously with credentials
    let emailResult: any = { success: false, error: "Not sent" };
    try {
      emailResult = await sendClientWelcomeEmail({
        to: email,
        companyName: name,
        password: rawPassword,
        token,
        secretKey,
        callbackUrl: callbackUrl || undefined,
      });
    } catch (e: any) {
      console.error("Email dispatch failed:", e);
    }

    return NextResponse.json({
      success: true,
      client,
      initialKey: { token, secretKey },
      password: rawPassword,
      emailResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, status, callbackUrl, ggrRate } = body;

    if (!id) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const updated = await db.operator.update({
      where: { id },
      data: {
        companyName: name || undefined,
        status: status || undefined,
        callbackUrl: callbackUrl || undefined,
        ggrRate: ggrRate !== undefined ? Number(ggrRate) : undefined,
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const target = await db.operator.findUnique({
      where: { id },
      select: { id: true, email: true, isAdmin: true, companyName: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Client not found or already deleted" }, { status: 404 });
    }

    if (target.isAdmin || target.email === "admin@royalggr.com") {
      return NextResponse.json(
        { error: "Action Prohibited: Master Provider Admin account cannot be deleted" },
        { status: 403 }
      );
    }

    // Clean cascade delete across all related tables in a single atomic transaction
    await db.$transaction(async (tx) => {
      await tx.operatorGameToggle.deleteMany({ where: { operatorId: id } });
      await tx.apiToken.deleteMany({ where: { operatorId: id } });
      await tx.operatorDepositRequest.deleteMany({ where: { operatorId: id } });
      await tx.operatorTransaction.deleteMany({ where: { operatorId: id } });
      await tx.webhookLog.deleteMany({ where: { operatorId: id } });
      await tx.gameRound.deleteMany({ where: { operatorId: id } });
      await tx.gameSession.deleteMany({ where: { operatorId: id } });
      await tx.operator.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: `Client ${target.companyName} deleted successfully` });
  } catch (error: any) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete client" }, { status: 500 });
  }
}
