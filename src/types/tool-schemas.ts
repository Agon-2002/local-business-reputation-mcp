import { z } from 'zod';

// ---- search_businesses ----
export const searchBusinessesInputSchema = {
  query: z.string()
    .describe('Search query to find businesses (e.g. "Bella Vista Italian Restaurant San Francisco")'),
  limit: z.number().int().min(1).max(20).optional().default(5)
    .describe('Maximum number of results (default 5)'),
};

// ---- get_reviews ----
export const getReviewsInputSchema = {
  placeId: z.string()
    .describe('Google Place ID of the business (from search_businesses)'),
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
};

// ---- get_summary ----
export const getSummaryInputSchema = {
  placeId: z.string()
    .describe('Google Place ID of the business'),
  period: z.enum(['7d', '14d', '30d', '90d']).optional().default('7d')
    .describe('Time period for the summary'),
};

// ---- draft_reply ----
export const draftReplyInputSchema = {
  placeId: z.string()
    .describe('Google Place ID of the business'),
  reviewId: z.string()
    .describe('ID of the review to draft a reply for'),
  tone: z.enum(['professional', 'friendly', 'apologetic', 'grateful'])
    .optional().default('professional')
    .describe('Desired tone for the reply'),
  customInstructions: z.string().optional()
    .describe('Additional instructions for crafting the reply (e.g. "mention our new menu")'),
};

// ---- analyze_competitors ----
export const analyzeCompetitorsInputSchema = {
  query: z.string()
    .describe('Search query to find competitors (e.g. "Italian restaurants near 123 Main St, San Francisco")'),
  ownPlaceId: z.string().optional()
    .describe('Your own business Place ID (from search_businesses) to include in the comparison'),
  limit: z.number().int().min(1).max(10).optional().default(5)
    .describe('Maximum number of competitors to analyze (max 10)'),
  reviewsPerCompetitor: z.number().int().min(5).max(50).optional().default(20)
    .describe('Number of reviews to fetch per competitor for analysis (max 50)'),
};
