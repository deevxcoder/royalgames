import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export interface WebhookLogItem {
  id: string;
  serialNumber: string;
  memberAccount: string;
  gameUid: string;
  gameName?: string;
  betAmount: number;
  winAmount: number;
  creditAmount: number;
  netChange: number;
  timestamp: number;
  receivedAt: string;
  signature?: string;
  rawPayload: any;
  status: "SUCCESS" | "INVALID_SIGNATURE";
}

// In-memory persistent storage across hot reloads
const logsKey = Symbol.for("test_client_webhook_logs");
const balancesKey = Symbol.for("test_client_player_balances");

if (!(globalThis as any)[logsKey]) {
  (globalThis as any)[logsKey] = [];
}
if (!(globalThis as any)[balancesKey]) {
  (globalThis as any)[balancesKey] = {
    player_rahul: 5000,
    player_amit: 5000,
    player_vikram: 10000,
  };
}

export const webhookLogs: WebhookLogItem[] = (globalThis as any)[logsKey];
export const playerBalances: Record<string, number> = (globalThis as any)[balancesKey];

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const serialNumber =
      payload.serial_number ||
      payload.serialNumber ||
      payload.game_round ||
      `SN_TEST_${Date.now()}`;

    const memberAccount =
      payload.member_account ||
      payload.memberAccount ||
      payload.user_id ||
      payload.userId ||
      "player_rahul";

    const gameUid = payload.game_uid || payload.gameUid || "royal_skyrush";
    const gameName = payload.game_name || payload.gameName || gameUid;
    const betAmount = Number(payload.bet_amount ?? payload.betAmount ?? 0);
    const winAmount = Number(payload.win_amount ?? payload.winAmount ?? 0);
    const creditAmount = Number(payload.credit_amount ?? payload.creditAmount ?? 0);
    const netChange = Number((winAmount - betAmount).toFixed(2));
    const timestamp = payload.timestamp || Date.now();
    const signature = req.headers.get("x-signature") || payload.signature;

    // Update test player balance
    if (typeof creditAmount === "number" && creditAmount >= 0) {
      playerBalances[memberAccount] = creditAmount;
    } else {
      playerBalances[memberAccount] = Math.max(0, (playerBalances[memberAccount] || 5000) + netChange);
    }

    const logItem: WebhookLogItem = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      serialNumber,
      memberAccount,
      gameUid,
      gameName,
      betAmount,
      winAmount,
      creditAmount: playerBalances[memberAccount],
      netChange,
      timestamp,
      receivedAt: new Date().toLocaleTimeString(),
      signature: signature || "HMAC_VERIFIED",
      rawPayload: payload,
      status: "SUCCESS",
    };

    // Store up to 50 logs
    webhookLogs.unshift(logItem);
    if (webhookLogs.length > 50) {
      webhookLogs.pop();
    }

    return NextResponse.json({
      status: 1,
      msg: "Callback processed successfully",
      serial_number: serialNumber,
      player_balance: playerBalances[memberAccount],
    });
  } catch (err: any) {
    console.error("Test Client Callback Error:", err);
    return NextResponse.json({ status: 0, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    logs: webhookLogs.slice(0, 30),
    balances: playerBalances,
  });
}
