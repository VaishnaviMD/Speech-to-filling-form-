// Simple in-memory sliding-window rate limiter for sensitive endpoints
type RateRecord = { count: number; resetAt: number };
const hits = new Map<string, RateRecord>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60 * 1000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const rec = hits.get(key);

  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (rec.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  rec.count++;
  return { ok: true, remaining: limit - rec.count };
}
