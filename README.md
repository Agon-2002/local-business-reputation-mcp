# Local Business Reputation MCP

MCP server for managing Google Business Profile reviews through AI. Fetch reviews, analyze trends, draft replies, post them directly, and benchmark against competitors.

Built for owner-operators of restaurants, salons, dental practices, gyms, and other local service businesses.

## Features

| Tool | Description |
|------|-------------|
| `list_locations` | List all business locations linked to your Google Business Profile |
| `get_reviews` | Fetch reviews with filters (star rating, date range, unreplied only) |
| `get_summary` | Weekly digest: average rating, trends, top complaints/compliments |
| `draft_reply` | Get review context and tone guidance for composing a reply |
| `post_reply` | Post a reply directly to Google (max 4096 chars) |
| `analyze_competitors` | Compare competitor ratings, reviews, and complaints (via Outscraper) |

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

### 1. Google Business Profile API (required for real data)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable the **Business Profile API**
3. Go to **Credentials** > Create **OAuth 2.0 Client ID** (Web application)
4. Add `http://localhost:3000/auth/callback` as an authorized redirect URI
5. Copy your Client ID and Client Secret to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

6. Run the auth script to get your refresh token:

```bash
npm run auth
```

This opens your browser for Google consent and saves the tokens locally.

### 2. Outscraper API (optional, for competitor analysis)

1. Create a free account at [outscraper.com](https://outscraper.com)
2. Get your API key from [app.outscraper.com/account/api](https://app.outscraper.com/account/api)
3. Add to `.env`:

```env
OUTSCRAPER_API_KEY=your-outscraper-api-key
```

Free tier includes 500 reviews/month.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | Yes* | - | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | - | Google OAuth 2.0 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | No | - | Pre-configured refresh token |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3000/auth/callback` | OAuth redirect URI |
| `OUTSCRAPER_API_KEY` | No | - | Outscraper API key for competitor analysis |
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
    google-auth.ts            - OAuth 2.0 flow
    google-api-client.ts      - Google Business Profile API wrapper
    review-service.ts         - Review service implementation
    mock-review-service.ts    - Mock service for dev/testing
    outscraper-client.ts      - Outscraper API wrapper
    competitor-service.ts     - Competitor analysis implementation
    mock-competitor-service.ts - Mock competitor data
  types/                      - TypeScript interfaces and Zod schemas
  utils/                      - Rate limiter, logger, mappers, helpers
```

## License

MIT
