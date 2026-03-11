// Application domain types — clean, normalized versions of Google API types

// Note: We avoid `readonly` on interfaces used as structuredContent
// because the MCP SDK requires `{ [x: string]: unknown }` compatibility.

export interface BusinessLocation {
  [key: string]: unknown;
  name: string;         // Full resource path (accounts/x/locations/y)
  displayName: string;
  phone?: string;
  website?: string;
  address?: {
    [key: string]: unknown;
    lines: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  category?: string;
}

export interface ReviewReply {
  [key: string]: unknown;
  comment: string;
  updatedAt: string;
}

export interface Review {
  [key: string]: unknown;
  id: string;
  name: string;         // Full resource path
  locationName: string;
  reviewerName: string;
  isAnonymous: boolean;
  stars: number;        // 1-5 numeric
  starRating: string;   // 'ONE'..'FIVE' string enum
  comment: string;
  createdAt: string;
  updatedAt: string;
  reply?: ReviewReply;
}

export interface RatingDistribution {
  [key: string]: unknown;
  one: number;
  two: number;
  three: number;
  four: number;
  five: number;
}

export interface ReviewTrend {
  [key: string]: unknown;
  direction: 'up' | 'down' | 'stable';
  previousAverage: number;
  change: number;
}

export interface ReviewSummary {
  [key: string]: unknown;
  locationName: string;
  period: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  trend: ReviewTrend;
  reviewVelocity: number;
  unrepliedCount: number;
  topComplaints: string[];
  topCompliments: string[];
}

export interface DraftReplyContext {
  [key: string]: unknown;
  review: Review;
  businessName: string;
  businessType?: string;
  tone: string;
  customInstructions?: string;
}
