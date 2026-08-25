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
  operatorId: string | null,
  dbSessionId: string | null,
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

    // Log success in database if operator exists
    if (operatorId) {
      try {
        await db.webhookLog.create({
          data: {
            operatorId,
            sessionId: dbSessionId || null,
            serialNumber: payload.serial_number,
            targetUrl: callbackUrl,
            payload: JSON.stringify(payload),
            responseCode: response.status,
            responseBody: typeof response.data === "string" ? response.data : JSON.stringify(response.data),
            status: "SUCCESS",
            attempts: 1,
          },
        });
      } catch (logErr) {
        console.error("Failed to write webhookLog:", logErr);
      }
    }

    return { success: true, status: response.status, data: response.data };
  } catch (err: any) {
    const status = err.response?.status || 500;
    const body = err.response?.data
      ? typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data)
      : err.message;

    // Log failure in database if operator exists
    if (operatorId) {
      try {
        await db.webhookLog.create({
          data: {
            operatorId,
            sessionId: dbSessionId || null,
            serialNumber: payload.serial_number,
            targetUrl: callbackUrl,
            payload: JSON.stringify(payload),
            responseCode: status,
            responseBody: body,
            status: "FAILED",
            attempts: 1,
          },
        });
      } catch (logErr) {
        console.error("Failed to write webhookLog failure:", logErr);
      }
    }

    return { success: false, status, error: err.message };
  }
}
