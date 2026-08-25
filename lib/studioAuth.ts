import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "royal_studio_master_secret_2026";
const ADMIN_PASSWORD_HASH = crypto.createHash("sha256").update("studio1234").digest("hex");

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateStudioApiKey(): { token: string; secretKey: string } {
  const tokenBytes = crypto.randomBytes(16).toString("hex");
  const secretBytes = crypto.randomBytes(32).toString("hex");
  return {
    token: `rgs_live_${tokenBytes}`,
    secretKey: `rgs_sec_${secretBytes}`,
  };
}

export function signStudioAdminToken(payload: { username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyStudioAdminToken(token: string): { username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
}

export async function getStudioAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("studio_admin_token")?.value;
  if (!token) return null;
  return verifyStudioAdminToken(token);
}

export interface StudioAuthResult {
  valid: boolean;
  statusCode?: number;
  error?: string;
  client?: any;
  tokenRecord?: any;
}

// In-memory token verification cache to prevent connection pool exhaustion on Supabase
const studioTokenCache = new Map<string, { tokenRecord: any; timestamp: number }>();
const STUDIO_TOKEN_CACHE_TTL_MS = 30000; // 30 seconds cache

export async function authenticateStudioRequest(req: NextRequest): Promise<StudioAuthResult> {
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-secret-key");
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token") || url.searchParams.get("api_key");
  const querySecret = url.searchParams.get("secret_key") || url.searchParams.get("secret");

  let tokenStr = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    tokenStr = authHeader.substring(7).trim();
  } else if (queryToken) {
    tokenStr = queryToken.trim();
  }

  if (!tokenStr) {
    return { valid: false, statusCode: 401, error: "Missing Studio API Token in Authorization header or query param" };
  }

  // Check in-memory cache first
  const now = Date.now();
  const cached = studioTokenCache.get(tokenStr);
  let tokenRecord: any = null;

  if (cached && now - cached.timestamp < STUDIO_TOKEN_CACHE_TTL_MS) {
    tokenRecord = cached.tokenRecord;
  } else {
    tokenRecord = await db.apiToken.findUnique({
      where: { token: tokenStr },
      include: { operator: true },
    });

    if (tokenRecord) {
      studioTokenCache.set(tokenStr, { tokenRecord, timestamp: now });
    }
  }

  if (!tokenRecord || !tokenRecord.isLive) {
    return { valid: false, statusCode: 401, error: "Invalid or deactivated Studio API Token" };
  }

  const client = tokenRecord.operator;
  if (!client || client.status === "SUSPENDED") {
    return { valid: false, statusCode: 403, error: "Aggregator client account is suspended" };
  }

  // Optional Secret Key Validation if provided
  const providedSecret = secretHeader || querySecret;
  if (providedSecret && providedSecret !== tokenRecord.secretKey) {
    return { valid: false, statusCode: 401, error: "Invalid Studio Secret Key" };
  }

  // IP Whitelist Check (if configured)
  if (tokenRecord.ipWhitelist) {
    const allowedIps = tokenRecord.ipWhitelist.split(",").map((ip: string) => ip.trim());
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const isAllowed =
      allowedIps.includes("*") ||
      allowedIps.includes(clientIp) ||
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "localhost";

    if (!isAllowed) {
      return { valid: false, statusCode: 403, error: `Client IP ${clientIp} not in whitelist` };
    }
  }

  return {
    valid: true,
    client,
    tokenRecord,
  };
}
