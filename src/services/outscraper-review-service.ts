import type { IReviewService, ServiceResult, SearchBusinessesResult, ListReviewsResult } from '../types/service.js';
import type { BusinessLocation, Review } from '../types/domain.js';
import type { OutscraperPlace, OutscraperReview, OutscraperPlaceWithReviews } from '../types/outscraper-api.js';
import type { OutscraperClient } from './outscraper-client.js';
import { logger } from '../utils/logger.js';

function mapPlaceToBusiness(place: OutscraperPlace): BusinessLocation {
  return {
    placeId: place.place_id,
    displayName: place.name,
    fullAddress: place.full_address,
    phone: place.phone,
    website: place.site,
    category: place.type,
    rating: place.rating,
    reviewCount: place.reviews,
  };
}

function mapReviewToDomain(placeId: string, review: OutscraperReview): Review {
  const reviewId = review.author_id
    ? `${review.author_id}-${review.review_timestamp}`
    : `anon-${review.review_timestamp}`;

  return {
    id: reviewId,
    placeId,
    reviewerName: review.author_title || 'Anonymous',
    isAnonymous: !review.author_title,
    stars: review.review_rating,
    comment: review.review_text || '',
    createdAt: review.review_datetime_utc,
    updatedAt: review.review_datetime_utc,
    reply: review.owner_answer
      ? {
          comment: review.owner_answer,
          updatedAt: review.owner_answer_timestamp
            ? new Date(review.owner_answer_timestamp * 1000).toISOString()
            : review.review_datetime_utc,
        }
      : undefined,
  };
}

export class OutscraperReviewService implements IReviewService {
  private readonly client: OutscraperClient;
  private readonly profileCache: Map<string, BusinessLocation> = new Map();

  constructor(client: OutscraperClient) {
    this.client = client;
  }

  async searchBusinesses(
    query: string,
    limit: number = 5,
  ): Promise<ServiceResult<SearchBusinessesResult>> {
    try {
      const places = await this.client.searchPlaces(query, limit);
      const businesses = places.map(mapPlaceToBusiness);

      // Cache profiles for later getBusinessProfile calls
      for (const biz of businesses) {
        this.profileCache.set(biz.placeId, biz);
      }

      return { success: true, data: { businesses } };
    } catch (err) {
      logger.error('searchBusinesses failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        error: `Failed to search businesses: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'API_ERROR',
      };
    }
  }

  async getReviews(
    placeId: string,
    options: { reviewsLimit?: number } = {},
  ): Promise<ServiceResult<ListReviewsResult>> {
    try {
      const reviewsLimit = options.reviewsLimit ?? 50;
      const results = await this.client.getReviews([placeId], reviewsLimit);
      const placeData: OutscraperPlaceWithReviews | undefined = results[0];

      if (!placeData) {
        return {
          success: false,
          error: `No data found for place: ${placeId}`,
          errorCode: 'NOT_FOUND',
        };
      }

      // Cache profile from review response
      this.profileCache.set(placeId, mapPlaceToBusiness(placeData));

      const reviews = (placeData.reviews_data ?? []).map(
        (r: OutscraperReview) => mapReviewToDomain(placeId, r),
      );

      const totalStars = reviews.reduce((sum: number, r: Review) => sum + r.stars, 0);
      const averageRating = reviews.length > 0
        ? Math.round((totalStars / reviews.length) * 100) / 100
        : placeData.rating ?? 0;

      return {
        success: true,
        data: {
          reviews,
          averageRating,
          totalReviewCount: placeData.reviews ?? reviews.length,
        },
      };
    } catch (err) {
      logger.error('getReviews failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        error: `Failed to fetch reviews: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'API_ERROR',
      };
    }
  }

  async getBusinessProfile(
    placeId: string,
  ): Promise<ServiceResult<BusinessLocation>> {
    // Check cache first (populated by searchBusinesses or getReviews)
    const cached = this.profileCache.get(placeId);
    if (cached) {
      return { success: true, data: cached };
    }

    // Fetch minimal reviews to get place metadata
    try {
      const results = await this.client.getReviews([placeId], 1);
      const placeData = results[0];

      if (!placeData) {
        return {
          success: false,
          error: `Business not found: ${placeId}`,
          errorCode: 'NOT_FOUND',
        };
      }

      const profile = mapPlaceToBusiness(placeData);
      this.profileCache.set(placeId, profile);
      return { success: true, data: profile };
    } catch (err) {
      logger.error('getBusinessProfile failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        error: `Failed to fetch business profile: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'API_ERROR',
      };
    }
  }
}
