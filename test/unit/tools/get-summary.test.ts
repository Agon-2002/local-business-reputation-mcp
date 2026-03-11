import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handleGetSummary } from '../../../src/server/tools/get-summary.js';

describe('get_summary tool', () => {
  const service = new MockReviewService();
  const placeId = 'mock-place-001';

  it('returns a summary for valid business', async () => {
    const result = await handleGetSummary(service, { placeId });

    expect(result.content[0].text).toContain('Review Summary');
    expect(result.content[0].text).toContain('Average Rating');
    expect(result.content[0].text).toContain('Rating Distribution');
  });

  it('includes rating distribution', async () => {
    const result = await handleGetSummary(service, { placeId, period: '90d' });
    const structured = result.structuredContent as {
      ratingDistribution: { one: number; two: number; three: number; four: number; five: number };
    };

    expect(structured.ratingDistribution).toBeDefined();
    const total = structured.ratingDistribution.one +
      structured.ratingDistribution.two +
      structured.ratingDistribution.three +
      structured.ratingDistribution.four +
      structured.ratingDistribution.five;
    expect(total).toBeGreaterThan(0);
  });

  it('includes trend information', async () => {
    const result = await handleGetSummary(service, { placeId, period: '30d' });
    const structured = result.structuredContent as {
      trend: { direction: string; previousAverage: number; change: number };
    };

    expect(['up', 'down', 'stable']).toContain(structured.trend.direction);
    expect(typeof structured.trend.change).toBe('number');
  });

  it('counts unreplied reviews', async () => {
    const result = await handleGetSummary(service, { placeId, period: '90d' });
    const structured = result.structuredContent as { unrepliedCount: number };

    expect(structured.unrepliedCount).toBeGreaterThan(0);
  });

  it('extracts top complaints from low-star reviews', async () => {
    const result = await handleGetSummary(service, { placeId, period: '90d' });
    const structured = result.structuredContent as { topComplaints: string[] };

    expect(Array.isArray(structured.topComplaints)).toBe(true);
  });

  it('extracts top compliments from high-star reviews', async () => {
    const result = await handleGetSummary(service, { placeId, period: '90d' });
    const structured = result.structuredContent as { topCompliments: string[] };

    expect(Array.isArray(structured.topCompliments)).toBe(true);
  });

  it('calculates review velocity', async () => {
    const result = await handleGetSummary(service, { placeId, period: '30d' });
    const structured = result.structuredContent as { reviewVelocity: number };

    expect(structured.reviewVelocity).toBeGreaterThanOrEqual(0);
  });
});
