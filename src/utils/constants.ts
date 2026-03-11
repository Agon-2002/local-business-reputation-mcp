// Business review constants

export const MAX_REVIEW_REPLY_LENGTH = 4096;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_REVIEWS_LIMIT = 50;

export const OUTSCRAPER_FREE_TIER_LIMIT = 500; // reviews per month

export const ERROR_CODES = {
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
} as const;
