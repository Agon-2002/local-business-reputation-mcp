// Google Business Profile API constants

export const GOOGLE_API_BASE_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1';
export const GOOGLE_REVIEWS_API_URL = 'https://mybusiness.googleapis.com/v4';
export const GOOGLE_ACCOUNT_MANAGEMENT_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
] as const;

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const DEFAULT_REDIRECT_URI = 'http://localhost:3000/auth/callback';

// Rate limits per Google documentation
export const RATE_LIMITS = {
  READS_PER_MINUTE: 2400,
  WRITES_PER_MINUTE: 10,
} as const;

export const MAX_REVIEW_REPLY_LENGTH = 4096;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// Star rating enum values from Google API
export const STAR_RATINGS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
export type StarRatingEnum = typeof STAR_RATINGS[number];

export const STAR_RATING_MAP: Record<StarRatingEnum, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;

export const NUMBER_TO_STAR_RATING: Record<number, StarRatingEnum> = {
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
} as const;

export const TOKEN_STORAGE_DIR = '.local-business-reputation-mcp';
export const TOKEN_FILE_NAME = '.tokens.json';

export const ERROR_CODES = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
} as const;
