import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { IReviewService } from '../types/service.js';
import {
  listLocationsInputSchema,
  getReviewsInputSchema,
  getSummaryInputSchema,
  draftReplyInputSchema,
  postReplyInputSchema,
} from '../types/tool-schemas.js';
import { handleListLocations } from './tools/list-locations.js';
import { handleGetReviews } from './tools/get-reviews.js';
import { handleGetSummary } from './tools/get-summary.js';
import { handleDraftReply } from './tools/draft-reply.js';
import { handlePostReply } from './tools/post-reply.js';

export function createMcpServer(service: IReviewService): McpServer {
  const server = new McpServer({
    name: 'local-business-reputation',
    version: '1.0.0',
  });

  // ---- list_locations ----
  server.registerTool(
    'list_locations',
    {
      title: 'List Locations',
      description: 'List all business locations linked to your Google Business Profile. Use this first to discover your location resource IDs.',
      inputSchema: listLocationsInputSchema,
    },
    async () => handleListLocations(service),
  );

  // ---- get_reviews ----
  server.registerTool(
    'get_reviews',
    {
      title: 'Get Reviews',
      description: 'Fetch reviews for a business location. Filter by star rating, date range, or unreplied status. Use this to triage reviews and find ones that need a response.',
      inputSchema: getReviewsInputSchema,
    },
    async (input) => handleGetReviews(service, input),
  );

  // ---- get_summary ----
  server.registerTool(
    'get_summary',
    {
      title: 'Get Summary',
      description: 'Get a reputation digest for a location: average rating, trend direction, rating distribution, review velocity, top complaints, and top compliments. Perfect for weekly check-ins.',
      inputSchema: getSummaryInputSchema,
    },
    async (input) => handleGetSummary(service, input),
  );

  // ---- draft_reply ----
  server.registerTool(
    'draft_reply',
    {
      title: 'Draft Reply',
      description: 'Get context for drafting a reply to a specific review. Returns the review details, business info, and tone guidance for composing a reply.',
      inputSchema: draftReplyInputSchema,
    },
    async (input) => handleDraftReply(service, input),
  );

  // ---- post_reply ----
  server.registerTool(
    'post_reply',
    {
      title: 'Post Reply',
      description: 'Post a reply to a Google review. The reply will be publicly visible on your Google Business Profile. Max 4096 characters.',
      inputSchema: postReplyInputSchema,
    },
    async (input) => handlePostReply(service, input),
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
      locationName: z.string().describe('Resource name of the location to summarize'),
    },
    async ({ locationName }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Please give me a weekly reputation digest for my business.`,
            `Use the get_summary tool with locationName "${locationName}" and period "7d".`,
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
