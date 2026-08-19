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
