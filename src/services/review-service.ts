import { GoogleApiClient } from './google-api-client.js';
import { mapGoogleLocationToDomain, mapGoogleReviewToDomain } from '../utils/mappers.js';
import { logger } from '../utils/logger.js';
import type { IReviewService, ServiceResult, ListLocationsResult, ListReviewsResult, PostReplyResult } from '../types/service.js';
import type { BusinessLocation } from '../types/domain.js';

export class ReviewService implements IReviewService {
  constructor(private readonly apiClient: GoogleApiClient) {}

  async listLocations(): Promise<ServiceResult<ListLocationsResult>> {
    try {
      const accountsResponse = await this.apiClient.listAccounts();
      const accounts = accountsResponse.accounts ?? [];

      const allLocations: BusinessLocation[] = [];

      for (const account of accounts) {
        const locationsResponse = await this.apiClient.listLocations(account.name);
        const locations = (locationsResponse.locations ?? []).map((loc) =>
          mapGoogleLocationToDomain(account.name, loc),
        );
        allLocations.push(...locations);
      }

      return {
        success: true,
        data: { locations: allLocations },
      };
    } catch (err) {
      return this.handleError(err, 'listLocations');
    }
  }

  async getReviews(
    locationName: string,
    options: { pageSize?: number; pageToken?: string; orderBy?: string } = {},
  ): Promise<ServiceResult<ListReviewsResult>> {
    try {
      const response = await this.apiClient.listReviews(locationName, {
        pageSize: options.pageSize ?? 20,
        pageToken: options.pageToken,
        orderBy: options.orderBy ?? 'updateTime desc',
      });

      const reviews = (response.reviews ?? []).map((review) =>
        mapGoogleReviewToDomain(locationName, review),
      );

      return {
        success: true,
        data: {
          reviews,
          averageRating: response.averageRating,
          totalReviewCount: response.totalReviewCount,
          nextPageToken: response.nextPageToken,
        },
      };
    } catch (err) {
      return this.handleError(err, 'getReviews');
    }
  }

  async getBusinessProfile(
    locationName: string,
  ): Promise<ServiceResult<BusinessLocation>> {
    try {
      // Extract account name from location name (accounts/xxx/locations/yyy -> accounts/xxx)
      const parts = locationName.split('/');
      const accountName = parts.slice(0, 2).join('/');

      const locationsResponse = await this.apiClient.listLocations(accountName);
      const location = (locationsResponse.locations ?? []).find(
        (loc) => `${accountName}/${loc.name}` === locationName,
      );

      if (!location) {
        return {
          success: false,
          error: `Location not found: ${locationName}`,
          errorCode: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: mapGoogleLocationToDomain(accountName, location),
      };
    } catch (err) {
      return this.handleError(err, 'getBusinessProfile');
    }
  }

  async postReply(
    locationName: string,
    reviewId: string,
    replyText: string,
  ): Promise<ServiceResult<PostReplyResult>> {
    try {
      const reviewName = `${locationName}/reviews/${reviewId}`;
      const response = await this.apiClient.updateReviewReply(reviewName, replyText);

      return {
        success: true,
        data: {
          reviewId,
          postedAt: response.updateTime,
        },
      };
    } catch (err) {
      return this.handleError(err, 'postReply');
    }
  }

  private handleError<T>(err: unknown, operation: string): ServiceResult<T> {
    const message = err instanceof Error ? err.message : String(err);
    const errorCode = (err as { code?: string }).code ?? 'API_ERROR';

    logger.error(`${operation} failed`, { error: message, errorCode });

    return {
      success: false,
      error: message,
      errorCode,
    };
  }
}
