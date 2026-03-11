import type {
  ICompetitorService,
  ServiceResult,
  SearchCompetitorsResult,
  CompetitorReviewsResult,
} from '../types/service.js';
import type { CompetitorBusiness, CompetitorReviewAnalysis, RatingDistribution } from '../types/domain.js';
import type { OutscraperReview } from '../types/outscraper-api.js';
import { OutscraperClient } from './outscraper-client.js';
import { logger } from '../utils/logger.js';

const COMPLAINT_KEYWORDS = [
  'wait', 'slow', 'rude', 'dirty', 'expensive', 'overpriced', 'cold',
  'wrong', 'mistake', 'poor', 'terrible', 'worst', 'unprofessional',
  'cancelled', 'charged', 'refund', 'disappointing',
];

const COMPLIMENT_KEYWORDS = [
  'friendly', 'clean', 'professional', 'great', 'excellent', 'amazing',
  'best', 'love', 'perfect', 'wonderful', 'recommend', 'welcoming',
  'quality', 'value', 'helpful', 'quick', 'fast', 'delicious',
];

function computeDistribution(reviews: OutscraperReview[]): RatingDistribution {
  const dist: RatingDistribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
  for (const review of reviews) {
    switch (review.review_rating) {
      case 1: dist.one++; break;
      case 2: dist.two++; break;
      case 3: dist.three++; break;
      case 4: dist.four++; break;
      case 5: dist.five++; break;
    }
  }
  return dist;
}

function extractTopics(reviews: OutscraperReview[], type: 'complaints' | 'compliments'): string[] {
  const targetReviews = type === 'complaints'
    ? reviews.filter((r) => r.review_rating <= 2)
    : reviews.filter((r) => r.review_rating >= 4);

  if (targetReviews.length === 0) return [];

  const keywords: Record<string, number> = {};
  const patterns = type === 'complaints' ? COMPLAINT_KEYWORDS : COMPLIMENT_KEYWORDS;

  for (const review of targetReviews) {
    if (!review.review_text) continue;
    const words = review.review_text.toLowerCase().split(/\W+/);
    for (const pattern of patterns) {
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

function countRecentReviews(reviews: OutscraperReview[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return reviews.filter((r) => r.review_timestamp * 1000 > cutoff).length;
}

export class CompetitorService implements ICompetitorService {
  constructor(private readonly client: OutscraperClient) {}

  async searchCompetitors(
    query: string,
    limit: number = 5,
  ): Promise<ServiceResult<SearchCompetitorsResult>> {
    try {
      const places = await this.client.searchPlaces(query, limit);
      const competitors: CompetitorBusiness[] = places.map((p) => ({
        placeId: p.place_id,
        name: p.name,
        fullAddress: p.full_address,
        rating: p.rating,
        reviewCount: p.reviews,
        phone: p.phone,
        website: p.site,
        category: p.type,
      }));
      return { success: true, data: { competitors } };
    } catch (err) {
      return this.handleError(err, 'searchCompetitors');
    }
  }

  async getCompetitorReviews(
    placeIds: string[],
    reviewsPerPlace: number = 20,
  ): Promise<ServiceResult<CompetitorReviewsResult>> {
    try {
      const placesWithReviews = await this.client.getReviews(placeIds, reviewsPerPlace);
      const analyses: CompetitorReviewAnalysis[] = placesWithReviews.map((place) => {
        const reviews = place.reviews_data ?? [];
        return {
          placeId: place.place_id,
          businessName: place.name,
          averageRating: place.rating,
          totalReviews: place.reviews,
          ratingDistribution: computeDistribution(reviews),
          topComplaints: extractTopics(reviews, 'complaints'),
          topCompliments: extractTopics(reviews, 'compliments'),
          recentReviewCount: countRecentReviews(reviews, 30),
        };
      });
      return { success: true, data: { analyses } };
    } catch (err) {
      return this.handleError(err, 'getCompetitorReviews');
    }
  }

  private handleError<T>(err: unknown, operation: string): ServiceResult<T> {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${operation} failed`, { error: message });
    return { success: false, error: message, errorCode: 'API_ERROR' };
  }
}
