import type { BusinessLocation, Review, CompetitorBusiness, CompetitorReviewAnalysis } from './domain.js';

export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly errorCode?: string;
}

export interface SearchBusinessesResult {
  readonly businesses: BusinessLocation[];
}

export interface ListReviewsResult {
  readonly reviews: Review[];
  readonly averageRating?: number;
  readonly totalReviewCount?: number;
}

export interface IReviewService {
  searchBusinesses(
    query: string,
    limit?: number,
  ): Promise<ServiceResult<SearchBusinessesResult>>;

  getReviews(
    placeId: string,
    options?: {
      reviewsLimit?: number;
    },
  ): Promise<ServiceResult<ListReviewsResult>>;

  getBusinessProfile(
    placeId: string,
  ): Promise<ServiceResult<BusinessLocation>>;
}

// Competitor analysis

export interface SearchCompetitorsResult {
  readonly competitors: CompetitorBusiness[];
}

export interface CompetitorReviewsResult {
  readonly analyses: CompetitorReviewAnalysis[];
}

export interface ICompetitorService {
  searchCompetitors(
    query: string,
    limit?: number,
  ): Promise<ServiceResult<SearchCompetitorsResult>>;

  getCompetitorReviews(
    placeIds: string[],
    reviewsPerPlace?: number,
  ): Promise<ServiceResult<CompetitorReviewsResult>>;
}
