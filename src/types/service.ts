import type { BusinessLocation, Review, CompetitorBusiness, CompetitorReviewAnalysis } from './domain.js';

export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly errorCode?: string;
}

export interface ListLocationsResult {
  readonly locations: BusinessLocation[];
  readonly nextPageToken?: string;
}

export interface ListReviewsResult {
  readonly reviews: Review[];
  readonly averageRating?: number;
  readonly totalReviewCount?: number;
  readonly nextPageToken?: string;
}

export interface PostReplyResult {
  readonly reviewId: string;
  readonly postedAt: string;
}

export interface IReviewService {
  listLocations(): Promise<ServiceResult<ListLocationsResult>>;

  getReviews(
    locationName: string,
    options?: {
      pageSize?: number;
      pageToken?: string;
      orderBy?: string;
    },
  ): Promise<ServiceResult<ListReviewsResult>>;

  getBusinessProfile(
    locationName: string,
  ): Promise<ServiceResult<BusinessLocation>>;

  postReply(
    locationName: string,
    reviewId: string,
    replyText: string,
  ): Promise<ServiceResult<PostReplyResult>>;
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
