// ফাইলের পাথ: lib/limiter.ts
// Vangcur (মূল সাইট)-এর lib/limiter.ts থেকে হুবহু কপি করা — একই মেকানিজম,
// একই env var নাম, যাতে ভবিষ্যতে Upstash যোগ করলে দুই প্রজেক্টেই একইভাবে কাজ করে।
//
// এখন (অক্টোবর ২০২৬) এডমিন প্যানেলের Vercel প্রজেক্টে কোনো Upstash Redis যোগ করা
// নেই — তাই নিচের redisConfig() সবসময় null ফেরত দেবে এবং সব কল ইনস্ট্যান্স-মেমোরি
// ফলব্যাকে (memSliding/memBucket) চলে যাবে। এডমিন লগইনে ট্রাফিক কম বলে এটা এখনকার
// জন্য যথেষ্ট; পরে Upstash যোগ করলে এই ফাইলে কোনো বদল ছাড়াই Redis-ব্যাকড হয়ে যাবে।
//
// env (ভবিষ্যতে Upstash যোগ করলে):
//   UPSTASH_REDIS_REST_URL ও UPSTASH_REDIS_REST_TOKEN  (অথবা KV_REST_API_URL / KV_REST_API_TOKEN)

export interface RateLimitOutcome {
  allowed: boolean;
  remaining: number;
  /** ব্লক হলে কত সেকেন্ড পরে আবার চেষ্টা করা যাবে */
  retryAfterSec: number;
}

const PREFIX = 'admin:rl:';

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  return url && token ? { url, token } : null;
}

function safeKey(key: string): string {
  return String(key).replace(/[\s\r\n]+/g, '_').slice(0, 160);
}

// Vangcur-এর lib/limiter.ts (C5 ফিক্স)-এর সাথে হুবহু মিল — cf-connecting-ip সবার আগে,
// তারপর Vercel/standard হেডার। Cloudflare প্রক্সি চালু না থাকলে cf-connecting-ip
// কখনো আসবে না, তখন x-vercel-forwarded-for/x-real-ip/x-forwarded-for দিয়েই চলবে।
export function getClientIp(headers: { get(name: string): string | null }): string {
  const cf = headers.get('cf-connecting-ip');
  const vercel = headers.get('x-vercel-forwarded-for');
  const real = headers.get('x-real-ip');
  const fwd = headers.get('x-forwarded-for');
  return (
    (cf ? cf.trim() : '') ||
    (vercel ? vercel.split(',')[0].trim() : '') ||
    (real ? real.trim() : '') ||
    (fwd ? fwd.split(',')[0].trim() : '') ||
    '127.0.0.1'
  );
}

// ───────────────────────── Lua (Redis-এর ভেতরে অ্যাটমিকভাবে চলে) ─────────────────────────

const SLIDING_LUA = `
local curr = KEYS[1]
local prev = KEYS[2]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local frac = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local c = tonumber(redis.call('GET', curr) or '0')
local p = tonumber(redis.call('GET', prev) or '0')
local used = p * (1 - frac) + c
local over
if cost == 0 then over = (used >= limit) else over = (used + cost > limit) end
if over then
  return {0, 0}
end
if cost > 0 then
  c = redis.call('INCRBY', curr, cost)
  if c == cost then redis.call('PEXPIRE', curr, windowMs * 2) end
  used = p * (1 - frac) + c
end
return {1, math.max(0, math.floor(limit - used))}
`;

const BUCKET_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local cap = tonumber(ARGV[2])
local refillPerMs = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])
local d = redis.call('HMGET', key, 't', 'ts')
local tokens = tonumber(d[1])
local ts = tonumber(d[2])
if tokens == nil or ts == nil then
  tokens = cap
  ts = now
end
tokens = math.min(cap, tokens + math.max(0, now - ts) * refillPerMs)
local allowed = 0
local retryMs = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retryMs = math.ceil((cost - tokens) / refillPerMs)
end
redis.call('HSET', key, 't', tostring(tokens), 'ts', tostring(now))
redis.call('PEXPIRE', key, ttl)
return {allowed, math.floor(tokens), retryMs}
`;

async function redisEval(script: string, keys: string[], args: (string | number)[]): Promise<number[]> {
  const cfg = redisConfig();
  if (!cfg) throw new Error('redis not configured');
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', script, String(keys.length), ...keys, ...args.map(String)]),
    cache: 'no-store',
    signal: AbortSignal.timeout(1200),
  });
  const json = (await res.json()) as { result?: number[]; error?: string };
  if (!res.ok || json.error || !Array.isArray(json.result)) {
    throw new Error(json.error || `redis http ${res.status}`);
  }
  return json.result.map(Number);
}

// ───────────────────── ফলব্যাক: ইনস্ট্যান্স-মেমোরি (Upstash না থাকলে/ব্যর্থ হলে) ─────────────────────

const memWindows = new Map<string, number>();
const memBuckets = new Map<string, { tokens: number; ts: number }>();

function memCleanup(now: number) {
  if (memWindows.size > 6000) {
    const keep = Math.floor(now / 1000);
    for (const k of Array.from(memWindows.keys())) {
      const exp = Number(k.split('|').pop());
      if (!Number.isFinite(exp) || exp < keep) memWindows.delete(k);
    }
  }
  if (memBuckets.size > 6000) {
    for (const [k, v] of Array.from(memBuckets.entries())) {
      if (now - v.ts > 3600_000) memBuckets.delete(k);
    }
  }
}

function memSliding(key: string, limit: number, windowSec: number, cost: number): RateLimitOutcome {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const id = Math.floor(now / windowMs);
  const frac = (now % windowMs) / windowMs;
  const expSec = Math.floor(((id + 2) * windowMs) / 1000);
  memCleanup(now);
  const cKey = `${key}:${id}|${expSec}`;
  const pKey = `${key}:${id - 1}|${expSec - windowSec}`;
  const c = memWindows.get(cKey) ?? 0;
  const p = memWindows.get(pKey) ?? 0;
  const used = p * (1 - frac) + c;
  const over = cost === 0 ? used >= limit : used + cost > limit;
  const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1000));
  if (over) return { allowed: false, remaining: 0, retryAfterSec };
  if (cost > 0) memWindows.set(cKey, c + cost);
  return { allowed: true, remaining: Math.max(0, Math.floor(limit - used - cost)), retryAfterSec: 0 };
}

function memBucket(key: string, capacity: number, refillPerSec: number, cost: number): RateLimitOutcome {
  const now = Date.now();
  memCleanup(now);
  const b = memBuckets.get(key) ?? { tokens: capacity, ts: now };
  const tokens = Math.min(capacity, b.tokens + Math.max(0, now - b.ts) * (refillPerSec / 1000));
  if (tokens >= cost) {
    memBuckets.set(key, { tokens: tokens - cost, ts: now });
    return { allowed: true, remaining: Math.floor(tokens - cost), retryAfterSec: 0 };
  }
  memBuckets.set(key, { tokens, ts: now });
  return {
    allowed: false,
    remaining: 0,
    retryAfterSec: Math.max(1, Math.ceil((cost - tokens) / refillPerSec)),
  };
}

// ───────────────────────────────────── পাবলিক API ─────────────────────────────────────

/**
 * স্লাইডিং-উইন্ডো: `windowSec` সেকেন্ডের মধ্যে সর্বোচ্চ `limit` বার।
 * `cost = 0` দিলে কিছু গণনা না করে শুধু দেখা যায় সীমা পার হয়েছে কিনা (peek)।
 */
export async function slidingWindowLimit(
  key: string,
  limit: number,
  windowSec: number,
  cost = 1,
): Promise<RateLimitOutcome> {
  const k = safeKey(key);
  if (redisConfig()) {
    try {
      const now = Date.now();
      const windowMs = windowSec * 1000;
      const id = Math.floor(now / windowMs);
      const frac = (now % windowMs) / windowMs;
      const [ok, remaining] = await redisEval(
        SLIDING_LUA,
        [`${PREFIX}sw:${k}:${id}`, `${PREFIX}sw:${k}:${id - 1}`],
        [limit, windowMs, frac.toFixed(6), cost],
      );
      return {
        allowed: ok === 1,
        remaining,
        retryAfterSec: ok === 1 ? 0 : Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1000)),
      };
    } catch {
      // Upstash সাময়িক ব্যর্থ — নিচে মেমোরি-ফলব্যাক; সাইট কখনো আটকায় না
    }
  }
  return memSliding(k, limit, windowSec, cost);
}

/**
 * টোকেন-বাকেট: বালতিতে সর্বোচ্চ `capacity`টা টোকেন, প্রতি সেকেন্ডে `refillPerSec`টা করে ফেরত আসে।
 */
export async function tokenBucketLimit(
  key: string,
  capacity: number,
  refillPerSec: number,
  cost = 1,
): Promise<RateLimitOutcome> {
  const k = safeKey(key);
  if (redisConfig()) {
    try {
      const ttlMs = Math.max(60_000, Math.ceil((capacity / refillPerSec) * 1000) * 2);
      const [ok, remaining, retryMs] = await redisEval(
        BUCKET_LUA,
        [`${PREFIX}tb:${k}`],
        [Date.now(), capacity, refillPerSec / 1000, cost, ttlMs],
      );
      return {
        allowed: ok === 1,
        remaining,
        retryAfterSec: ok === 1 ? 0 : Math.max(1, Math.ceil(retryMs / 1000)),
      };
    } catch {
      // ফলব্যাক
    }
  }
  return memBucket(k, capacity, refillPerSec, cost);
}
