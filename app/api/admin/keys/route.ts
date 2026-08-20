import { NextResponse } from "next/server";
import { getStudioAdmin, generateStudioApiKey } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { clientId, name = "Production Key", ipWhitelist } = await req.json();
    if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const { token, secretKey } = generateStudioApiKey();

    const created = await db.apiToken.create({
      data: {
        operatorId: clientId,
        token,
        secretKey,
        name,
        isLive: true,
        ipWhitelist: ipWhitelist || null,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: created.id,
        name: created.name,
        token: created.token,
        secretKey: created.secretKey,
        ipWhitelist: created.ipWhitelist,
        createdAt: created.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await getStudioAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");
    if (!keyId) return NextResponse.json({ error: "Key ID required" }, { status: 400 });

    await db.apiToken.delete({ where: { id: keyId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
