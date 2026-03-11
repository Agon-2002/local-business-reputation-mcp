import type { IReviewService } from '../../types/service.js';
import { formatStars } from '../../utils/star-rating.js';

export interface DraftReplyInput {
  placeId: string;
  reviewId: string;
  tone?: 'professional' | 'friendly' | 'apologetic' | 'grateful';
  customInstructions?: string;
}

const TONE_GUIDANCE: Record<string, string> = {
  professional: 'Write a calm, professional response. Be courteous but measured. Acknowledge the feedback without being defensive.',
  friendly: 'Write a warm, friendly response. Use a conversational tone. Show genuine care and personality.',
  apologetic: 'Write a sincere, apologetic response. Take responsibility where appropriate. Offer to make things right. Show empathy.',
  grateful: 'Write a heartfelt, grateful response. Express genuine appreciation. Highlight what makes the customer special.',
};

export async function handleDraftReply(service: IReviewService, input: DraftReplyInput) {
  // Fetch the specific review
  const reviewsResult = await service.getReviews(input.placeId, { reviewsLimit: 50 });

  if (!reviewsResult.success || !reviewsResult.data) {
    return {
      content: [{ type: 'text' as const, text: `Error fetching reviews: ${reviewsResult.error}` }],
      isError: true,
    };
  }

  const review = reviewsResult.data.reviews.find((r) => r.id === input.reviewId);
  if (!review) {
    return {
      content: [{
        type: 'text' as const,
        text: `Review not found: ${input.reviewId}. Use get_reviews to find available review IDs.`,
      }],
      isError: true,
    };
  }

  // Fetch business profile for context
  const profileResult = await service.getBusinessProfile(input.placeId);
  const businessName = profileResult.success && profileResult.data
    ? profileResult.data.displayName
    : 'the business';
  const businessType = profileResult.success && profileResult.data
    ? profileResult.data.category
    : undefined;

  const tone = input.tone ?? 'professional';
  const toneGuidance = TONE_GUIDANCE[tone];

  // Build context for drafting the reply
  const contextText = [
    '## Review Reply Context',
    '',
    `**Business:** ${businessName}${businessType ? ` (${businessType})` : ''}`,
    `**Reviewer:** ${review.reviewerName}`,
    `**Rating:** ${formatStars(review.stars)} (${review.stars}/5)`,
    `**Date:** ${new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '**Review:**',
    `> ${review.comment || '(No comment provided)'}`,
    '',
    '---',
    '',
    `**Requested Tone:** ${tone}`,
    `**Guidance:** ${toneGuidance}`,
    input.customInstructions ? `**Additional Instructions:** ${input.customInstructions}` : null,
    '',
    '---',
    '',
    'Please draft a reply to this review based on the context above. Keep it under 4096 characters.',
    'You can then post this reply manually through your Google Business Profile dashboard.',
  ].filter((line) => line !== null).join('\n');

  const output = {
    review: {
      reviewId: review.id,
      reviewerName: review.reviewerName,
      stars: review.stars,
      comment: review.comment,
      createTime: review.createdAt,
    },
    businessContext: {
      businessName,
      businessType,
    },
    tone,
    customInstructions: input.customInstructions,
  };

  return {
    content: [{ type: 'text' as const, text: contextText }],
    structuredContent: output,
  };
}
