import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handlePostReply } from '../../../src/server/tools/post-reply.js';

describe('post_reply tool', () => {
  const locationName = 'accounts/123/locations/456';

  it('posts a reply successfully', async () => {
    const service = new MockReviewService();
    const result = await handlePostReply(service, {
      locationName,
      reviewId: 'review-456-006',
      replyText: 'Thank you for your feedback. We are sorry to hear about your experience.',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Reply posted successfully');
    expect(result.content[0].text).toContain('review-456-006');
  });

  it('returns structured content with post confirmation', async () => {
    const service = new MockReviewService();
    const result = await handlePostReply(service, {
      locationName,
      reviewId: 'review-456-006',
      replyText: 'We appreciate your feedback.',
    });

    const structured = result.structuredContent as {
      success: boolean;
      reviewId: string;
      postedAt: string;
    };

    expect(structured.success).toBe(true);
    expect(structured.reviewId).toBe('review-456-006');
    expect(structured.postedAt).toBeDefined();
  });

  it('rejects empty reply text', async () => {
    const service = new MockReviewService();
    const result = await handlePostReply(service, {
      locationName,
      reviewId: 'review-456-006',
      replyText: '   ',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('empty');
  });

  it('rejects reply exceeding max length', async () => {
    const service = new MockReviewService();
    const result = await handlePostReply(service, {
      locationName,
      reviewId: 'review-456-006',
      replyText: 'x'.repeat(5000),
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('too long');
  });

  it('returns error for non-existent review', async () => {
    const service = new MockReviewService();
    const result = await handlePostReply(service, {
      locationName,
      reviewId: 'non-existent',
      replyText: 'Hello',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to post reply');
  });
});
