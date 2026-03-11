import type { IReviewService } from '../../types/service.js';
import { MAX_REVIEW_REPLY_LENGTH } from '../../utils/constants.js';

export interface PostReplyInput {
  locationName: string;
  reviewId: string;
  replyText: string;
}

export async function handlePostReply(service: IReviewService, input: PostReplyInput) {
  // Validate reply length
  if (input.replyText.length > MAX_REVIEW_REPLY_LENGTH) {
    return {
      content: [{
        type: 'text' as const,
        text: `Reply is too long (${input.replyText.length} characters). Maximum is ${MAX_REVIEW_REPLY_LENGTH} characters.`,
      }],
      isError: true,
    };
  }

  if (input.replyText.trim().length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'Reply text cannot be empty.',
      }],
      isError: true,
    };
  }

  const result = await service.postReply(input.locationName, input.reviewId, input.replyText);

  if (!result.success || !result.data) {
    return {
      content: [{
        type: 'text' as const,
        text: `Failed to post reply: ${result.error}`,
      }],
      isError: true,
    };
  }

  const output = {
    success: true,
    reviewId: result.data.reviewId,
    postedAt: result.data.postedAt,
    replyPreview: input.replyText.slice(0, 200) + (input.replyText.length > 200 ? '...' : ''),
  };

  return {
    content: [{
      type: 'text' as const,
      text: `Reply posted successfully to review \`${result.data.reviewId}\` at ${result.data.postedAt}.\n\n**Posted reply:**\n> ${output.replyPreview}`,
    }],
    structuredContent: output,
  };
}
