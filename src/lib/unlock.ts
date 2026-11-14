import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Unlock tokens prove that a Stripe payment was verified by our server.
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, UNLOCK_SECRET)).
 * scope is either an analysisId (one bill) or "family" (annual plan, all bills).
 */
export type UnlockPayload = { scope: string; plan: "single" | "family"; exp: number; nonce: string };

function secret(): string {
  const s = process.env.UNLOCK_SECRET;
  if (!s || s.length < 16) throw new Error("UNLOCK_SECRET is missing or too short (min 16 chars).");
  return s;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signUnlock(scope: string, plan: UnlockPayload["plan"], ttlDays: number, now = Date.now()): string {
  const payload: UnlockPayload = { scope, plan, exp: now + ttlDays * 86_400_000, nonce: randomBytes(8).toString("hex") };
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyUnlock(token: string | null | undefined, analysisId: string, now = Date.now()): UnlockPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload: UnlockPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (payload.exp < now) return null;
  if (payload.scope !== "family" && payload.scope !== analysisId) return null;
  return payload;
}
