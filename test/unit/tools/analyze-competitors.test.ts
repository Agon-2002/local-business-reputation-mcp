import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { MockCompetitorService } from '../../../src/services/mock-competitor-service.js';
import { handleAnalyzeCompetitors } from '../../../src/server/tools/analyze-competitors.js';

describe('analyze_competitors tool', () => {
  const reviewService = new MockReviewService();
  const competitorService = new MockCompetitorService();

  it('returns competitor analysis for a valid query', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants near 123 Main St',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Competitor Analysis');
    expect(result.content[0].text).toContain('Italian restaurants near 123 Main St');
  });

  it('returns structured content with competitor data', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants near 123 Main St',
    });

    const structured = result.structuredContent as {
      competitors: Array<{ businessName: string; averageRating: number }>;
    };

    expect(structured.competitors.length).toBeGreaterThan(0);
    expect(structured.competitors[0].businessName).toBe('Trattoria Roma');
    expect(structured.competitors[0].averageRating).toBe(4.2);
  });

  it('includes own business comparison when ownPlaceId provided', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants near 123 Main St',
      ownPlaceId: 'mock-place-001',
    });

    const structured = result.structuredContent as {
      ownBusiness: { businessName: string } | undefined;
    };

    expect(structured.ownBusiness).toBeDefined();
    expect(structured.ownBusiness!.businessName).toBe('Bella Vista Italian Restaurant');
  });

  it('generates insights when comparing to own business', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants near 123 Main St',
      ownPlaceId: 'mock-place-001',
    });

    const structured = result.structuredContent as {
      insights: Array<{ type: string; message: string }>;
    };

    expect(Array.isArray(structured.insights)).toBe(true);
    expect(structured.insights.length).toBeGreaterThan(0);
  });

  it('respects the limit parameter', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants near 123 Main St',
      limit: 3,
    });

    const structured = result.structuredContent as {
      competitors: unknown[];
    };

    expect(structured.competitors.length).toBeLessThanOrEqual(3);
  });

  it('handles empty search results gracefully', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'nonexistent business type in nowhere',
    });

    expect(result.content[0].text).toContain('No competitors found');
  });

  it('shows rating and review count for each competitor', async () => {
    const result = await handleAnalyzeCompetitors(competitorService, reviewService, {
      query: 'Italian restaurants',
    });

    expect(result.content[0].text).toContain('4.2/5.0');
    expect(result.content[0].text).toContain('187 reviews');
  });
});
