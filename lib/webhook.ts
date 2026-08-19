import axios from "axios";
import { db } from "./db";

export interface SettlementPayload {
  game_id: number;
  game_uid: string;
  game_round: string;
  member_account: string;
  bet_amount: number;
  win_amount: number;
  credit_amount: number;
  serial_number: string;
  game_name: string;
  timestamp: number;
}

export async function dispatchWebhookCallback(
  operatorId: string,
  sessionId: string,
  callbackUrl: string,
  payload: SettlementPayload
): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const response = await axios.post(callbackUrl, payload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RoyalGames-Webhook-Dispatcher/1.0",
      },
    });

    // Log success
    await db.webhookLog.create({
      data: {
        operatorId,
        sessionId,
        serialNumber: payload.serial_number,
        targetUrl: callbackUrl,
        payload: JSON.stringify(payload),
        responseCode: response.status,
        responseBody: typeof response.data === "string" ? response.data : JSON.stringify(response.data),
        status: "SUCCESS",
        attempts: 1,
      },
    });

    return { success: true, status: response.status, data: response.data };
  } catch (err: any) {
    const status = err.response?.status || 500;
    const body = err.response?.data ? (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data)) : err.message;

    // Log failure
    await db.webhookLog.create({
      data: {
        operatorId,
        sessionId,
        serialNumber: payload.serial_number,
        targetUrl: callbackUrl,
        payload: JSON.stringify(payload),
        responseCode: status,
        responseBody: body,
        status: "FAILED",
        attempts: 1,
      },
    });

    return { success: false, status, error: err.message };
  }
}
