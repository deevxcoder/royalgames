import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudioAdminToken } from "@/lib/studioAuth";
import { db } from "@/lib/db";
import crypto from "crypto";
import axios from "axios";

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

    const operator = await db.operator.findUnique({
      where: { email: payload.username },
      include: { tokens: true },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const callbackUrl = body.callbackUrl || operator.callbackUrl;

    if (!callbackUrl) {
      return NextResponse.json({ error: "Callback URL is required" }, { status: 400 });
    }

    const testSecret = operator.tokens[0]?.secretKey || "sec_test_mock_secret";
    const serialNumber = `test_serial_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const samplePayload = {
      event: "round_settled",
      serial_number: serialNumber,
      member_account: "player_test_8872",
      game_uid: "royal_skyrush",
      game_name: "Sky Rush",
      bet_amount: 100.0,
      win_amount: 196.0,
      net_result: 96.0,
      credit_amount: 1096.0,
      ggr_fee: 9.6,
      currency: operator.currency || "INR",
      timestamp: new Date().toISOString(),
    };

    // Calculate HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", testSecret)
      .update(JSON.stringify(samplePayload))
      .digest("hex");

    const startTime = Date.now();
    let responseStatus = 0;
    let responseData: any = null;
    let errorMsg = null;

    try {
      const response = await axios.post(callbackUrl, samplePayload, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Operator-Id": operator.id,
          "User-Agent": "RoyalGamesStudio-WebhookAgent/1.0",
        },
        timeout: 8000,
      });
      responseStatus = response.status;
      responseData = response.data;
    } catch (err: any) {
      responseStatus = err.response?.status || 500;
      responseData = err.response?.data || null;
      errorMsg = err.message;
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: responseStatus >= 200 && responseStatus < 300,
      callbackUrl,
      httpStatus: responseStatus,
      latencyMs,
      payloadSent: samplePayload,
      signatureSent: signature,
      responseReceived: responseData,
      error: errorMsg,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
