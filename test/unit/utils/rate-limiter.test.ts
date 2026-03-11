import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../../src/utils/rate-limiter.js';

describe('rate limiter', () => {
  it('allows requests within limits', async () => {
    const limiter = createRateLimiter(100, 10);

    // Should not throw or delay
    const start = Date.now();
    await limiter.acquireRead();
    await limiter.acquireRead();
    await limiter.acquireRead();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('allows write requests within limits', async () => {
    const limiter = createRateLimiter(100, 10);

    const start = Date.now();
    await limiter.acquireWrite();
    await limiter.acquireWrite();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('has separate read and write buckets', async () => {
    const limiter = createRateLimiter(100, 10);

    // Reads shouldn't affect writes
    for (let i = 0; i < 5; i++) {
      await limiter.acquireRead();
    }

    const start = Date.now();
    await limiter.acquireWrite();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
