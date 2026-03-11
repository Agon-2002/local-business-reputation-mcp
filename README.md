# Local Business Reputation MCP

MCP server for monitoring and managing local business reviews through AI. Search businesses, fetch reviews, analyze trends, draft replies, and benchmark against competitors — all powered by Google Maps data via Outscraper.

Built for owner-operators of restaurants, salons, dental practices, gyms, and other local service businesses.

## Features

| Tool | Description |
|------|-------------|
| `search_businesses` | Search for businesses by name, category, or location |
| `get_reviews` | Fetch reviews with filters (star rating, date range, unreplied only) |
| `get_summary` | Weekly digest: average rating, trends, top complaints/compliments |
| `draft_reply` | Get review context and tone guidance for composing a reply |
| `analyze_competitors` | Compare competitor ratings, reviews, and complaints |

Plus 2 prompt templates: `review-response` and `weekly-digest`.

## Quick Start

```bash
# Install dependencies
npm install

# Run in mock mode (no API keys needed)
ENABLE_MOCK_MODE=true npm run dev

# Build for production
npm run build
npm start
```

## Setup

### Outscraper API

All business and review data comes from [Outscraper](https://outscraper.com), which provides Google Maps data via a simple API.

1. Create a free account at [outscraper.com](https://outscraper.com)
2. Get your API key from [app.outscraper.com/account/api](https://app.outscraper.com/account/api)
3. Add to `.env`:

```env
OUTSCRAPER_API_KEY=your-outscraper-api-key
```

Free tier includes 500 reviews/month — enough for most small businesses.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OUTSCRAPER_API_KEY` | Yes* | - | Outscraper API key for business and review data |
| `ENABLE_MOCK_MODE` | No | `false` | Use mock data without any API keys |
| `PORT` | No | `8080` | Server port |
| `LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |

\* Not required when `ENABLE_MOCK_MODE=true`

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npx tsc --noEmit

# Run with hot reload
npm run dev
```

## Architecture

```
src/
  index.ts                    - Entry point, Express server
  server/
    mcp-server.ts             - Tool and prompt registration
    tools/                    - Individual tool handlers
  services/
    outscraper-client.ts      - Outscraper API wrapper
    outscraper-review-service.ts - Review service (Outscraper-backed)
    competitor-service.ts     - Competitor analysis implementation
    mock-review-service.ts    - Mock service for dev/testing
    mock-competitor-service.ts - Mock competitor data
  types/                      - TypeScript interfaces and Zod schemas
  utils/                      - Rate limiter, logger, helpers
```

## License

MIT
