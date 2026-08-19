import crypto from "crypto";

export interface ProvablyFairResult {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export function generateServerSeed(): { serverSeed: string; serverSeedHash: string } {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return { serverSeed, serverSeedHash };
}

export function calculateOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  maxOutcome: number = 10000
): number {
  const hmac = crypto.createHmac("sha256", serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hash = hmac.digest("hex");

  const sub = hash.substring(0, 8);
  const intVal = parseInt(sub, 16);
  return (intVal % maxOutcome) / maxOutcome;
}
