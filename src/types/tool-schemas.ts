import { z } from 'zod';

// ---- list_locations ----
export const listLocationsInputSchema = {};

// ---- get_reviews ----
export const getReviewsInputSchema = {
  locationName: z.string()
    .describe('Resource name of the location (from list_locations, e.g. accounts/xxx/locations/yyy)'),
  starRating: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']).optional()
    .describe('Filter to a specific star rating'),
  minStars: z.number().int().min(1).max(5).optional()
    .describe('Minimum star rating (1-5)'),
  maxStars: z.number().int().min(1).max(5).optional()
    .describe('Maximum star rating (1-5)'),
  dateFrom: z.string().optional()
    .describe('Start date filter (ISO 8601, e.g. 2026-03-01)'),
  dateTo: z.string().optional()
    .describe('End date filter (ISO 8601, e.g. 2026-03-11)'),
  unrepliedOnly: z.boolean().optional().default(false)
    .describe('Only show reviews without replies'),
  pageSize: z.number().int().min(1).max(50).optional().default(20)
    .describe('Results per page (max 50)'),
  pageToken: z.string().optional()
    .describe('Pagination token from previous response'),
};

// ---- get_summary ----
export const getSummaryInputSchema = {
  locationName: z.string()
    .describe('Resource name of the location'),
  period: z.enum(['7d', '14d', '30d', '90d']).optional().default('7d')
    .describe('Time period for the summary'),
};

// ---- draft_reply ----
export const draftReplyInputSchema = {
  locationName: z.string()
    .describe('Resource name of the location'),
  reviewId: z.string()
    .describe('ID of the review to draft a reply for'),
  tone: z.enum(['professional', 'friendly', 'apologetic', 'grateful'])
    .optional().default('professional')
    .describe('Desired tone for the reply'),
  customInstructions: z.string().optional()
    .describe('Additional instructions for crafting the reply (e.g. "mention our new menu")'),
};

// ---- post_reply ----
export const postReplyInputSchema = {
  locationName: z.string()
    .describe('Resource name of the location'),
  reviewId: z.string()
    .describe('ID of the review to reply to'),
  replyText: z.string().min(1).max(4096)
    .describe('The reply text to post (max 4096 characters)'),
};

// ---- analyze_competitors ----
export const analyzeCompetitorsInputSchema = {
  query: z.string()
    .describe('Search query to find competitors (e.g. "Italian restaurants near 123 Main St, San Francisco")'),
  businessLocationName: z.string().optional()
    .describe('Your own location resource name (from list_locations) to include in the comparison'),
  limit: z.number().int().min(1).max(10).optional().default(5)
    .describe('Maximum number of competitors to analyze (max 10)'),
  reviewsPerCompetitor: z.number().int().min(5).max(50).optional().default(20)
    .describe('Number of reviews to fetch per competitor for analysis (max 50)'),
};
