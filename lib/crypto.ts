import crypto from "crypto";

export function generateApiKey(prefix = "roy_live_"): { token: string; secretKey: string } {
  const token = `${prefix}${crypto.randomBytes(16).toString("hex")}`;
  const secretKey = crypto.randomBytes(32).toString("hex");
  return { token, secretKey };
}

export function decryptPayload(encryptedBase64: string, keyHex: string): any {
  try {
    const key = Buffer.from(keyHex.slice(0, 32), "utf8");
    const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (err: any) {
    throw new Error(`Failed to decrypt payload: ${err.message}`);
  }
}

export function encryptPayload(data: any, keyHex: string): string {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  const key = Buffer.from(keyHex.slice(0, 32), "utf8");
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(json, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}
