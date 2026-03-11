import type { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './google-auth.js';
import { logger } from '../utils/logger.js';
import { createRateLimiter, type RateLimiter } from '../utils/rate-limiter.js';
import {
  GOOGLE_ACCOUNT_MANAGEMENT_URL,
  GOOGLE_REVIEWS_API_URL,
  RATE_LIMITS,
  ERROR_CODES,
} from '../utils/constants.js';
import type {
  GoogleListAccountsResponse,
  GoogleListLocationsResponse,
  GoogleListReviewsResponse,
  GoogleUpdateReplyResponse,
} from '../types/google-api.js';

export interface ListReviewsOptions {
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

export class GoogleApiClient {
  private readonly rateLimiter: RateLimiter;

  constructor(private readonly authService: GoogleAuthService) {
    this.rateLimiter = createRateLimiter(
      RATE_LIMITS.READS_PER_MINUTE,
      RATE_LIMITS.WRITES_PER_MINUTE,
    );
  }

  async listAccounts(): Promise<GoogleListAccountsResponse> {
    await this.rateLimiter.acquireRead();
    const client = await this.authService.getAuthenticatedClient();
    return this.fetchWithRetry<GoogleListAccountsResponse>(
      client,
      `${GOOGLE_ACCOUNT_MANAGEMENT_URL}/accounts`,
    );
  }

  async listLocations(accountName: string): Promise<GoogleListLocationsResponse> {
    await this.rateLimiter.acquireRead();
    const client = await this.authService.getAuthenticatedClient();
    return this.fetchWithRetry<GoogleListLocationsResponse>(
      client,
      `${GOOGLE_ACCOUNT_MANAGEMENT_URL}/${accountName}/locations`,
    );
  }

  async listReviews(
    locationName: string,
    options: ListReviewsOptions = {},
  ): Promise<GoogleListReviewsResponse> {
    await this.rateLimiter.acquireRead();
    const client = await this.authService.getAuthenticatedClient();

    const params = new URLSearchParams();
    if (options.pageSize) params.set('pageSize', String(options.pageSize));
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.orderBy) params.set('orderBy', options.orderBy);

    const query = params.toString();
    const url = `${GOOGLE_REVIEWS_API_URL}/${locationName}/reviews${query ? `?${query}` : ''}`;

    return this.fetchWithRetry<GoogleListReviewsResponse>(client, url);
  }

  async updateReviewReply(
    reviewName: string,
    comment: string,
  ): Promise<GoogleUpdateReplyResponse> {
    await this.rateLimiter.acquireWrite();
    const client = await this.authService.getAuthenticatedClient();

    const url = `${GOOGLE_REVIEWS_API_URL}/${reviewName}/reply`;

    return this.fetchWithRetry<GoogleUpdateReplyResponse>(
      client,
      url,
      {
        method: 'PUT',
        body: JSON.stringify({ comment }),
      },
    );
  }

  private async fetchWithRetry<T>(
    client: OAuth2Client,
    url: string,
    init?: RequestInit,
    retries = 3,
  ): Promise<T> {
    const headers = await this.getAuthHeaders(client);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            ...(init?.headers as Record<string, string> | undefined),
          },
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const status = response.status;
        const body = await response.text();

        // Retryable errors
        if ((status === 429 || status >= 500) && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          logger.warn(`API request failed (${status}), retrying in ${Math.round(delay)}ms`, {
            url,
            attempt: attempt + 1,
            status,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new ApiError(
          `Google API error: ${status} - ${body}`,
          ERROR_CODES.API_ERROR,
          status,
        );
      } catch (err) {
        if (err instanceof ApiError) throw err;

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Network error, retrying in ${delay}ms`, {
            error: err instanceof Error ? err.message : String(err),
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new ApiError(
          `Network error: ${err instanceof Error ? err.message : String(err)}`,
          ERROR_CODES.API_ERROR,
          0,
        );
      }
    }

    // Unreachable but satisfies TypeScript
    throw new ApiError('Max retries exceeded', ERROR_CODES.API_ERROR, 0);
  }

  private async getAuthHeaders(client: OAuth2Client): Promise<Record<string, string>> {
    const accessToken = client.credentials.access_token;
    if (!accessToken) {
      throw new ApiError('No access token available', ERROR_CODES.NOT_AUTHENTICATED, 401);
    }
    return { Authorization: `Bearer ${accessToken}` };
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
