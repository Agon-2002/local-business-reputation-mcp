import type { IReviewService } from '../../types/service.js';
import type { Review, RatingDistribution, ReviewTrend, ReviewSummary } from '../../types/domain.js';

export interface GetSummaryInput {
  placeId: string;
  period?: '7d' | '14d' | '30d' | '90d';
}

const PERIOD_DAYS: Record<string, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
};

async function fetchAllReviews(
  service: IReviewService,
  placeId: string,
): Promise<Review[]> {
  const result = await service.getReviews(placeId, { reviewsLimit: 200 });
  if (!result.success || !result.data) return [];
  return result.data.reviews;
}

function filterByPeriod(reviews: Review[], days: number): Review[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return reviews.filter((r) => new Date(r.createdAt) >= cutoff);
}

function computeDistribution(reviews: Review[]): RatingDistribution {
  const dist = { one: 0, two: 0, three: 0, four: 0, five: 0 };
  for (const review of reviews) {
    switch (review.stars) {
      case 1: dist.one++; break;
      case 2: dist.two++; break;
      case 3: dist.three++; break;
      case 4: dist.four++; break;
      case 5: dist.five++; break;
    }
  }
  return dist;
}

function computeAverage(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.stars, 0);
  return Math.round((total / reviews.length) * 100) / 100;
}

function computeTrend(
  currentReviews: Review[],
  allReviews: Review[],
  periodDays: number,
): ReviewTrend {
  const previousCutoff = new Date(Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000);
  const currentCutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const previousReviews = allReviews.filter((r) => {
    const date = new Date(r.createdAt);
    return date >= previousCutoff && date < currentCutoff;
  });

  const currentAvg = computeAverage(currentReviews);
  const previousAvg = computeAverage(previousReviews);
  const change = Math.round((currentAvg - previousAvg) * 100) / 100;

  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(change) < 0.1) direction = 'stable';
  else if (change > 0) direction = 'up';
  else direction = 'down';

  return { direction, previousAverage: previousAvg, change };
}

function extractTopics(reviews: Review[], type: 'complaints' | 'compliments'): string[] {
  const targetReviews = type === 'complaints'
    ? reviews.filter((r) => r.stars <= 2)
    : reviews.filter((r) => r.stars >= 4);

  if (targetReviews.length === 0) return [];

  const keywords: Record<string, number> = {};
  const topicPatterns = type === 'complaints'
    ? [
        'wait', 'slow', 'rude', 'dirty', 'expensive', 'overpriced', 'cold',
        'wrong', 'mistake', 'poor', 'terrible', 'worst', 'unprofessional',
        'cancelled', 'charged', 'refund', 'disappointing', 'hair', 'bug',
      ]
    : [
        'friendly', 'clean', 'professional', 'great', 'excellent', 'amazing',
        'best', 'love', 'perfect', 'wonderful', 'recommend', 'welcoming',
        'quality', 'value', 'helpful', 'quick', 'fast', 'delicious',
      ];

  for (const review of targetReviews) {
    const words = review.comment.toLowerCase().split(/\W+/);
    for (const pattern of topicPatterns) {
      if (words.some((w) => w.includes(pattern))) {
        keywords[pattern] = (keywords[pattern] ?? 0) + 1;
      }
    }
  }

  return Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword, count]) => `${keyword} (${count} mentions)`);
}

export async function handleGetSummary(service: IReviewService, input: GetSummaryInput) {
  const period = input.period ?? '7d';
  const periodDays = PERIOD_DAYS[period];
  const allReviews = await fetchAllReviews(service, input.placeId);

  if (allReviews.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No reviews found for this business.',
      }],
    };
  }

  const periodReviews = filterByPeriod(allReviews, periodDays);
  const distribution = computeDistribution(periodReviews);
  const averageRating = computeAverage(periodReviews);
  const trend = computeTrend(periodReviews, allReviews, periodDays);
  const velocity = periodReviews.length / periodDays;
  const unrepliedCount = periodReviews.filter((r) => !r.reply).length;
  const topComplaints = extractTopics(periodReviews, 'complaints');
  const topCompliments = extractTopics(periodReviews, 'compliments');

  const summary: ReviewSummary = {
    placeId: input.placeId,
    period,
    averageRating,
    totalReviews: periodReviews.length,
    ratingDistribution: distribution,
    trend,
    reviewVelocity: Math.round(velocity * 100) / 100,
    unrepliedCount,
    topComplaints,
    topCompliments,
  };

  const trendEmoji = trend.direction === 'up' ? 'trending up' : trend.direction === 'down' ? 'trending down' : 'stable';
  const trendSign = trend.change >= 0 ? '+' : '';

  const text = [
    `## Review Summary (Last ${period})`,
    '',
    `**Average Rating:** ${averageRating.toFixed(1)} / 5.0 (${trendEmoji}, ${trendSign}${trend.change.toFixed(2)} from previous period)`,
    `**Total Reviews:** ${periodReviews.length} (${velocity.toFixed(1)} reviews/day)`,
    `**Unreplied:** ${unrepliedCount}`,
    '',
    '### Rating Distribution',
    `  5 stars: ${'*'.repeat(distribution.five)} (${distribution.five})`,
    `  4 stars: ${'*'.repeat(distribution.four)} (${distribution.four})`,
    `  3 stars: ${'*'.repeat(distribution.three)} (${distribution.three})`,
    `  2 stars: ${'*'.repeat(distribution.two)} (${distribution.two})`,
    `  1 star:  ${'*'.repeat(distribution.one)} (${distribution.one})`,
    '',
    topComplaints.length > 0
      ? `### Top Complaints\n${topComplaints.map((c) => `- ${c}`).join('\n')}`
      : '### Top Complaints\nNone in this period',
    '',
    topCompliments.length > 0
      ? `### Top Compliments\n${topCompliments.map((c) => `- ${c}`).join('\n')}`
      : '### Top Compliments\nNone in this period',
  ].join('\n');

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: summary,
  };
}
