import { NextResponse } from "next/server";
import { getStudioAdmin, generateStudioApiKey, hashPassword } from "@/lib/studioAuth";
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
    const { name, email, callbackUrl, ipWhitelist, ggrRate = 10.0 } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Company name and email are required" }, { status: 400 });
    }

    const { token, secretKey } = generateStudioApiKey();
    const passwordHash = hashPassword(`studio_${Date.now()}`);

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

    return NextResponse.json({
      success: true,
      client,
      initialKey: { token, secretKey },
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
    const { id, name, status, callbackUrl } = body;

    if (!id) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const updated = await db.operator.update({
      where: { id },
      data: {
        companyName: name || undefined,
        status: status || undefined,
        callbackUrl: callbackUrl || undefined,
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

    await db.operator.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
