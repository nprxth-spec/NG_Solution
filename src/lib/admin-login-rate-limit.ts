import { Redis } from "@upstash/redis";

const WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS = 10;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

type MemEntry = { count: number; resetAt: number };
const mem = new Map<string, MemEntry>();

function memPrune() {
  const now = Date.now();
  for (const [k, v] of mem) {
    if (now > v.resetAt) mem.delete(k);
  }
}

export function getRequestIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/**
 * จำกัดความถี่ล็อกอินแอดมิน — ใช้ Upstash Redis ถ้ามี ไม่เช่นนั้น in-memory (โหนดเดียว)
 */
export async function checkAdminLoginRateLimit(
  ip: string,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const key = `rl:admin_login:${ip}`;
  const client = getRedis();
  if (client) {
    try {
      const n = await client.incr(key);
      if (n === 1) await client.expire(key, WINDOW_SEC);
      if (n > MAX_ATTEMPTS) {
        return { ok: false, retryAfterSec: WINDOW_SEC };
      }
      return { ok: true };
    } catch (e) {
      console.warn("[admin-login-rate-limit] Redis error, using memory:", e);
    }
  }

  memPrune();
  const now = Date.now();
  let entry = mem.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_SEC * 1000 };
    mem.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { ok: true };
}
