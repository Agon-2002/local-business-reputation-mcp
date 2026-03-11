import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handleSearchBusinesses } from '../../../src/server/tools/search-businesses.js';

describe('search_businesses tool', () => {
  const service = new MockReviewService();

  it('returns businesses for a matching query', async () => {
    const result = await handleSearchBusinesses(service, { query: 'bella' });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Bella Vista Italian Restaurant');
    expect(result.isError).toBeUndefined();
  });

  it('returns structured content with business data', async () => {
    const result = await handleSearchBusinesses(service, { query: 'restaurant' });
    const structured = result.structuredContent as {
      businesses: Array<{ placeId: string; displayName: string; rating?: number }>;
      totalCount: number;
    };

    expect(structured.totalCount).toBeGreaterThan(0);
    expect(structured.businesses[0].placeId).toBe('mock-place-001');
    expect(structured.businesses[0].displayName).toBe('Bella Vista Italian Restaurant');
  });

  it('includes address and phone in text output', async () => {
    const result = await handleSearchBusinesses(service, { query: 'bella' });

    expect(result.content[0].text).toContain('123 Main Street');
    expect(result.content[0].text).toContain('+1-555-0101');
  });

  it('includes Place IDs for each business', async () => {
    const result = await handleSearchBusinesses(service, { query: 'san francisco' });

    expect(result.content[0].text).toContain('mock-place-001');
  });

  it('returns all locations for broad queries', async () => {
    const result = await handleSearchBusinesses(service, { query: 'san francisco' });
    const structured = result.structuredContent as { totalCount: number };

    expect(structured.totalCount).toBe(3);
  });

  it('includes rating info when available', async () => {
    const result = await handleSearchBusinesses(service, { query: 'bella' });
    const structured = result.structuredContent as {
      businesses: Array<{ rating?: number; reviewCount?: number }>;
    };

    expect(structured.businesses[0].rating).toBeDefined();
    expect(structured.businesses[0].reviewCount).toBeDefined();
  });
});
