// Application domain types — provider-agnostic business review types

// Note: We avoid `readonly` on interfaces used as structuredContent
// because the MCP SDK requires `{ [x: string]: unknown }` compatibility.

export interface BusinessLocation {
  [key: string]: unknown;
  placeId: string;
  displayName: string;
  fullAddress?: string;
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
  rating?: number;
  reviewCount?: number;
}

export interface ReviewReply {
  [key: string]: unknown;
  comment: string;
  updatedAt: string;
}

export interface Review {
  [key: string]: unknown;
  id: string;
  placeId: string;
  reviewerName: string;
  isAnonymous: boolean;
  stars: number;        // 1-5 numeric
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
  placeId: string;
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

// Competitor analysis types

export interface CompetitorBusiness {
  [key: string]: unknown;
  placeId: string;
  name: string;
  fullAddress: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  website?: string;
  category?: string;
}

export interface CompetitorReviewAnalysis {
  [key: string]: unknown;
  placeId: string;
  businessName: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  topComplaints: string[];
  topCompliments: string[];
  recentReviewCount: number;
}

export interface CompetitorInsight {
  [key: string]: unknown;
  type: 'strength' | 'weakness' | 'opportunity';
  message: string;
}

export interface CompetitorAnalysisResult {
  [key: string]: unknown;
  query: string;
  competitors: CompetitorReviewAnalysis[];
  ownBusiness?: CompetitorReviewAnalysis;
  insights: CompetitorInsight[];
}
