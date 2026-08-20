import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "royal_games_provider_super_secret_jwt_key_2026";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function comparePassword(password: string, hash: string): boolean {
  const computed = crypto.createHash("sha256").update(password).digest("hex");
  return computed === hash;
}

export function signOperatorToken(payload: { operatorId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyOperatorToken(token: string): { operatorId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { operatorId: string; email: string };
  } catch {
    return null;
  }
}

export function signSessionToken(payload: { sessionId: string; operatorId: string; userId: string; gameUid: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });
}

export function verifySessionToken(token: string): any | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getCurrentOperator() {
  const { cookies } = await import("next/headers");
  const { db } = await import("./db");
  const cookieStore = await cookies();
  const token = cookieStore.get("royal_operator_token")?.value;
  if (!token) return null;

  const decoded = verifyOperatorToken(token);
  if (!decoded) return null;

  const operator = await db.operator.findUnique({
    where: { id: decoded.operatorId },
    include: {
      tokens: { orderBy: { createdAt: "desc" } },
    },
  });

  return operator;
}

export const getOperatorFromCookie = getCurrentOperator;
