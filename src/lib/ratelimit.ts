/**
 * Tiny in-memory sliding-window rate limiter (per serverless instance).
 * Good enough to stop a demo from draining LLM credits by accident; not a security boundary.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 10, windowMs = 60 * 60 * 1000): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
