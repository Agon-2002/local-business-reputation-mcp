import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { IReviewService, ICompetitorService } from '../types/service.js';
import {
  searchBusinessesInputSchema,
  getReviewsInputSchema,
  getSummaryInputSchema,
  draftReplyInputSchema,
  analyzeCompetitorsInputSchema,
} from '../types/tool-schemas.js';
import { handleSearchBusinesses } from './tools/search-businesses.js';
import { handleGetReviews } from './tools/get-reviews.js';
import { handleGetSummary } from './tools/get-summary.js';
import { handleDraftReply } from './tools/draft-reply.js';
import { handleAnalyzeCompetitors } from './tools/analyze-competitors.js';

export function createMcpServer(
  service: IReviewService,
  competitorService: ICompetitorService,
): McpServer {
  const server = new McpServer({
    name: 'local-business-reputation',
    version: '2.0.0',
  });

  // ---- search_businesses ----
  server.registerTool(
    'search_businesses',
    {
      title: 'Search Businesses',
      description: 'Search for businesses by name and location. Returns Place IDs needed for other tools. Use this first to find your business or any business you want to analyze.',
      inputSchema: searchBusinessesInputSchema,
    },
    async (input) => handleSearchBusinesses(service, input),
  );

  // ---- get_reviews ----
  server.registerTool(
    'get_reviews',
    {
      title: 'Get Reviews',
      description: 'Fetch reviews for a business. Filter by star rating, date range, or unreplied status. Use the Place ID from search_businesses.',
      inputSchema: getReviewsInputSchema,
    },
    async (input) => handleGetReviews(service, input),
  );

  // ---- get_summary ----
  server.registerTool(
    'get_summary',
    {
      title: 'Get Summary',
      description: 'Get a reputation digest for a business: average rating, trend direction, rating distribution, review velocity, top complaints, and top compliments. Perfect for weekly check-ins.',
      inputSchema: getSummaryInputSchema,
    },
    async (input) => handleGetSummary(service, input),
  );

  // ---- draft_reply ----
  server.registerTool(
    'draft_reply',
    {
      title: 'Draft Reply',
      description: 'Get context for drafting a reply to a specific review. Returns the review details, business info, and tone guidance for composing a reply. Post the reply manually through your Google Business Profile dashboard.',
      inputSchema: draftReplyInputSchema,
    },
    async (input) => handleDraftReply(service, input),
  );

  // ---- analyze_competitors ----
  server.registerTool(
    'analyze_competitors',
    {
      title: 'Analyze Competitors',
      description: 'Search for competing businesses and compare their review profiles. Returns ratings, review counts, top complaints/compliments per competitor, and insights comparing them to your business.',
      inputSchema: analyzeCompetitorsInputSchema,
    },
    async (input) => handleAnalyzeCompetitors(competitorService, service, input),
  );

  // ---- Prompts ----
  server.prompt(
    'review-response',
    'Generate a professional response to a customer review',
    {
      reviewText: z.string().describe('The customer review text to respond to'),
      businessName: z.string().describe('Name of the business'),
      tone: z.string().optional().describe('Desired tone: professional, friendly, apologetic, or grateful'),
    },
    async ({ reviewText, businessName, tone }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `You are the owner of ${businessName}. Write a reply to this customer review.`,
            `Tone: ${tone ?? 'professional'}`,
            '',
            `Review: "${reviewText}"`,
            '',
            'Guidelines:',
            '- Keep it under 200 words',
            '- Be empathetic and genuine',
            '- Address specific concerns mentioned',
            '- Never be defensive or dismissive',
            '- If negative, offer to make it right',
            '- If positive, show genuine gratitude',
          ].join('\n'),
        },
      }],
    }),
  );

  server.prompt(
    'weekly-digest',
    'Generate a weekly reputation digest for a business',
    {
      placeId: z.string().describe('Place ID of the business to summarize (from search_businesses)'),
    },
    async ({ placeId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Please give me a weekly reputation digest for my business.`,
            `Use the get_summary tool with placeId "${placeId}" and period "7d".`,
            'Then analyze the results and provide:',
            '1. Key highlights (good and bad)',
            '2. Any reviews I should respond to urgently',
            '3. Actionable recommendations',
          ].join('\n'),
        },
      }],
    }),
  );

  return server;
}
