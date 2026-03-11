import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handleGetReviews } from '../../../src/server/tools/get-reviews.js';

describe('get_reviews tool', () => {
  const service = new MockReviewService();
  const locationName = 'accounts/123/locations/456';

  it('returns reviews for a valid location', async () => {
    const result = await handleGetReviews(service, { locationName });

    expect(result.content[0].text).toContain('Showing');
    expect(result.content[0].text).toContain('reviews');
    expect(result.isError).toBeUndefined();
  });

  it('filters by max stars', async () => {
    const result = await handleGetReviews(service, { locationName, maxStars: 2 });
    const structured = result.structuredContent as { reviews: Array<{ stars: number }> };

    for (const review of structured.reviews) {
      expect(review.stars).toBeLessThanOrEqual(2);
    }
  });

  it('filters by min stars', async () => {
    const result = await handleGetReviews(service, { locationName, minStars: 4 });
    const structured = result.structuredContent as { reviews: Array<{ stars: number }> };

    for (const review of structured.reviews) {
      expect(review.stars).toBeGreaterThanOrEqual(4);
    }
  });

  it('filters unreplied only', async () => {
    const result = await handleGetReviews(service, { locationName, unrepliedOnly: true });
    const structured = result.structuredContent as { reviews: Array<{ hasReply: boolean }> };

    for (const review of structured.reviews) {
      expect(review.hasReply).toBe(false);
    }
  });

  it('returns error for non-existent location', async () => {
    const result = await handleGetReviews(service, { locationName: 'accounts/999/locations/999' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });

  it('respects pageSize', async () => {
    const result = await handleGetReviews(service, { locationName, pageSize: 5 });
    const structured = result.structuredContent as { reviews: unknown[] };

    expect(structured.reviews.length).toBeLessThanOrEqual(5);
  });

  it('shows average rating in output', async () => {
    const result = await handleGetReviews(service, { locationName });

    expect(result.content[0].text).toContain('Average rating');
  });
});
