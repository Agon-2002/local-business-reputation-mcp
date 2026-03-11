import { logger } from './logger.js';

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per ms
  lastRefill: number;
}

function createBucket(tokensPerMinute: number): TokenBucket {
  return {
    tokens: tokensPerMinute,
    maxTokens: tokensPerMinute,
    refillRate: tokensPerMinute / 60000,
    lastRefill: Date.now(),
  };
}

function refillBucket(bucket: TokenBucket): TokenBucket {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const newTokens = Math.min(
    bucket.maxTokens,
    bucket.tokens + elapsed * bucket.refillRate,
  );

  return {
    ...bucket,
    tokens: newTokens,
    lastRefill: now,
  };
}

function tryConsume(bucket: TokenBucket): { allowed: boolean; bucket: TokenBucket; retryAfterMs: number } {
  const refilled = refillBucket(bucket);

  if (refilled.tokens >= 1) {
    return {
      allowed: true,
      bucket: { ...refilled, tokens: refilled.tokens - 1 },
      retryAfterMs: 0,
    };
  }

  const waitMs = Math.ceil((1 - refilled.tokens) / refilled.refillRate);
  return {
    allowed: false,
    bucket: refilled,
    retryAfterMs: waitMs,
  };
}

export interface RateLimiter {
  acquireRead(): Promise<void>;
  acquireWrite(): Promise<void>;
}

export function createRateLimiter(readsPerMinute: number, writesPerMinute: number): RateLimiter {
  let readBucket = createBucket(readsPerMinute);
  let writeBucket = createBucket(writesPerMinute);

  async function acquire(type: 'read' | 'write'): Promise<void> {
    const bucket = type === 'read' ? readBucket : writeBucket;
    const result = tryConsume(bucket);

    if (type === 'read') {
      readBucket = result.bucket;
    } else {
      writeBucket = result.bucket;
    }

    if (result.allowed) return;

    logger.warn(`Rate limited on ${type}, waiting ${result.retryAfterMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, result.retryAfterMs));
    return acquire(type);
  }

  return {
    acquireRead: () => acquire('read'),
    acquireWrite: () => acquire('write'),
  };
}
