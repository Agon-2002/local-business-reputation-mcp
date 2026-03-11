import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handleDraftReply } from '../../../src/server/tools/draft-reply.js';

describe('draft_reply tool', () => {
  const service = new MockReviewService();
  const locationName = 'accounts/123/locations/456';

  it('returns review context for drafting', async () => {
    const result = await handleDraftReply(service, {
      locationName,
      reviewId: 'review-456-006',
    });

    expect(result.content[0].text).toContain('Review Reply Context');
    expect(result.content[0].text).toContain('David W.');
    expect(result.content[0].text).toContain('Bella Vista Italian Restaurant');
  });

  it('includes tone guidance', async () => {
    const result = await handleDraftReply(service, {
      locationName,
      reviewId: 'review-456-006',
      tone: 'apologetic',
    });

    expect(result.content[0].text).toContain('apologetic');
    expect(result.content[0].text).toContain('Guidance');
  });

  it('includes custom instructions when provided', async () => {
    const result = await handleDraftReply(service, {
      locationName,
      reviewId: 'review-456-006',
      customInstructions: 'Mention our new chef',
    });

    expect(result.content[0].text).toContain('Mention our new chef');
  });

  it('returns error for non-existent review', async () => {
    const result = await handleDraftReply(service, {
      locationName,
      reviewId: 'non-existent-review',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Review not found');
  });

  it('returns structured content with review and business data', async () => {
    const result = await handleDraftReply(service, {
      locationName,
      reviewId: 'review-456-001',
      tone: 'grateful',
    });

    const structured = result.structuredContent as {
      review: { reviewId: string; starRating: string };
      businessContext: { businessName: string };
      tone: string;
    };

    expect(structured.review.reviewId).toBe('review-456-001');
    expect(structured.businessContext.businessName).toBe('Bella Vista Italian Restaurant');
    expect(structured.tone).toBe('grateful');
  });
});
