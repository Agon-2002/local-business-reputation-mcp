import type { IReviewService } from '../../types/service.js';
import type { Review } from '../../types/domain.js';
import { isInStarRange, formatStars } from '../../utils/star-rating.js';
import type { StarRatingEnum } from '../../utils/constants.js';

export interface GetReviewsInput {
  locationName: string;
  starRating?: string;
  minStars?: number;
  maxStars?: number;
  dateFrom?: string;
  dateTo?: string;
  unrepliedOnly?: boolean;
  pageSize?: number;
  pageToken?: string;
}

function filterReviews(reviews: Review[], input: GetReviewsInput): Review[] {
  return reviews.filter((review) => {
    // Star rating exact match
    if (input.starRating && review.starRating !== input.starRating) {
      return false;
    }

    // Star range filter
    if (!isInStarRange(review.starRating as StarRatingEnum, input.minStars, input.maxStars)) {
      return false;
    }

    // Date range filter
    if (input.dateFrom) {
      const fromDate = new Date(input.dateFrom);
      if (new Date(review.createdAt) < fromDate) return false;
    }
    if (input.dateTo) {
      const toDate = new Date(input.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(review.createdAt) > toDate) return false;
    }

    // Unreplied only
    if (input.unrepliedOnly && review.reply) {
      return false;
    }

    return true;
  });
}

function formatReview(review: Review): string {
  const stars = formatStars(review.stars);
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const lines = [
    `${stars} by **${review.reviewerName}** — ${date}`,
    review.comment ? `> ${review.comment}` : '> *(No comment)*',
    review.reply ? `\n  *Owner replied:* ${review.reply.comment.slice(0, 100)}${review.reply.comment.length > 100 ? '...' : ''}` : '  *No reply yet*',
    `  Review ID: \`${review.id}\``,
  ];

  return lines.join('\n');
}

export async function handleGetReviews(service: IReviewService, input: GetReviewsInput) {
  const result = await service.getReviews(input.locationName, {
    pageSize: 50, // Fetch max to allow client-side filtering
    pageToken: input.pageToken,
  });

  if (!result.success || !result.data) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${result.error}` }],
      isError: true,
    };
  }

  const filtered = filterReviews(result.data.reviews, input);

  // Apply page size to filtered results
  const pageSize = input.pageSize ?? 20;
  const page = filtered.slice(0, pageSize);

  if (page.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No reviews found matching your filters.',
      }],
    };
  }

  const formatted = page.map(formatReview);
  const summary = [
    `Showing ${page.length} of ${result.data.totalReviewCount ?? filtered.length} reviews`,
    result.data.averageRating ? `Average rating: ${result.data.averageRating.toFixed(1)} / 5.0` : null,
  ].filter(Boolean).join(' | ');

  const output = {
    reviews: page.map((r) => ({
      reviewId: r.id,
      reviewer: { displayName: r.reviewerName, isAnonymous: r.isAnonymous },
      starRating: r.starRating,
      stars: r.stars,
      comment: r.comment,
      createTime: r.createdAt,
      updateTime: r.updatedAt,
      hasReply: !!r.reply,
      replyPreview: r.reply?.comment.slice(0, 100),
    })),
    averageRating: result.data.averageRating,
    totalReviewCount: result.data.totalReviewCount,
    nextPageToken: result.data.nextPageToken,
    filtersApplied: {
      starRating: input.starRating,
      minStars: input.minStars,
      maxStars: input.maxStars,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      unrepliedOnly: input.unrepliedOnly,
    },
  };

  return {
    content: [{
      type: 'text' as const,
      text: `${summary}\n\n${formatted.join('\n\n---\n\n')}`,
    }],
    structuredContent: output,
  };
}
