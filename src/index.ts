import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { type Request, type Response } from 'express';
import chalk from 'chalk';
import { config } from 'dotenv';

import { createMcpServer } from './server/mcp-server.js';
import { OutscraperReviewService } from './services/outscraper-review-service.js';
import { MockReviewService } from './services/mock-review-service.js';
import { CompetitorService } from './services/competitor-service.js';
import { MockCompetitorService } from './services/mock-competitor-service.js';
import { OutscraperClient } from './services/outscraper-client.js';
import type { IReviewService, ICompetitorService } from './types/service.js';
import { logger } from './utils/logger.js';

config();

// ============================================================================
// Dev Logging Utilities
// ============================================================================

const isDev = process.env.NODE_ENV !== 'production';

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function formatLatency(ms: number): string {
  if (ms < 100) return chalk.green(`${ms}ms`);
  if (ms < 500) return chalk.yellow(`${ms}ms`);
  return chalk.red(`${ms}ms`);
}

function truncate(str: string, maxLen = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function logRequest(method: string, params?: unknown): void {
  if (!isDev) return;
  const paramsStr = params ? chalk.gray(` ${truncate(JSON.stringify(params))}`) : '';
  console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.cyan('→')} ${method}${paramsStr}`);
}

function logResponse(method: string, result: unknown, latencyMs: number): void {
  if (!isDev) return;
  const latency = formatLatency(latencyMs);
  if (method === 'tools/call' && result) {
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
    console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.green('←')} ${truncate(resultStr)} ${chalk.gray(`(${latency})`)}`);
  } else {
    console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.green('✓')} ${method} ${chalk.gray(`(${latency})`)}`);
  }
}

function logError(method: string, error: unknown, latencyMs: number): void {
  const latency = formatLatency(latencyMs);
  let errorMsg: string;
  if (error instanceof Error) {
    errorMsg = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const rpcError = error as { message?: string; code?: number };
    errorMsg = rpcError.message || `Error ${rpcError.code || 'unknown'}`;
  } else {
    errorMsg = String(error);
  }
  console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.red('✖')} ${method} ${chalk.red(truncate(errorMsg))} ${chalk.gray(`(${latency})`)}`);
}

// ============================================================================
// Service Initialization
// ============================================================================

function createServices(): { reviewService: IReviewService; competitorService: ICompetitorService } {
  if (process.env.ENABLE_MOCK_MODE === 'true') {
    logger.info('Running in MOCK MODE — no API calls will be made');
    return {
      reviewService: new MockReviewService(),
      competitorService: new MockCompetitorService(),
    };
  }

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) {
    logger.warn('OUTSCRAPER_API_KEY not set. Falling back to mock mode.');
    logger.warn('Set OUTSCRAPER_API_KEY for real data, or set ENABLE_MOCK_MODE=true');
    return {
      reviewService: new MockReviewService(),
      competitorService: new MockCompetitorService(),
    };
  }

  const client = new OutscraperClient(apiKey);
  logger.info('Services initialized via Outscraper');
  return {
    reviewService: new OutscraperReviewService(client),
    competitorService: new CompetitorService(client),
  };
}

// ============================================================================
// Express App Setup
// ============================================================================

function main(): void {
  const { reviewService, competitorService } = createServices();
  const server = createMcpServer(reviewService, competitorService);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy' });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const body = req.body;
    const method = body?.method || 'unknown';
    const params = body?.params;

    if (method === 'tools/call') {
      logRequest(`tools/call ${chalk.bold(params?.name || 'unknown')}`, params?.arguments);
    } else if (method !== 'notifications/initialized') {
      logRequest(method, params);
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    let responseBody = '';
    const originalWrite = res.write.bind(res) as typeof res.write;
    const originalEnd = res.end.bind(res) as typeof res.end;

    res.write = function (chunk: unknown, encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void) {
      if (chunk) {
        responseBody += typeof chunk === 'string' ? chunk : Buffer.from(chunk as ArrayBuffer).toString();
      }
      return originalWrite(chunk as string, encodingOrCallback as BufferEncoding, callback);
    };

    res.end = function (chunk?: unknown, encodingOrCallback?: BufferEncoding | (() => void), callback?: () => void) {
      if (chunk) {
        responseBody += typeof chunk === 'string' ? chunk : Buffer.from(chunk as ArrayBuffer).toString();
      }
      if (method !== 'notifications/initialized') {
        const latency = Date.now() - startTime;
        try {
          const rpcResponse = JSON.parse(responseBody) as { result?: unknown; error?: unknown };
          if (rpcResponse?.error) {
            logError(method, rpcResponse.error, latency);
          } else if (method === 'tools/call') {
            const content = (rpcResponse?.result as { content?: Array<{ text?: string }> })?.content;
            logResponse(method, content?.[0]?.text, latency);
          } else {
            logResponse(method, null, latency);
          }
        } catch {
          logResponse(method, null, latency);
        }
      }
      return originalEnd(chunk as string, encodingOrCallback as BufferEncoding, callback);
    };

    res.on('close', () => { transport.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || '8080');
  app.listen(port, () => {
    console.log();
    console.log(chalk.bold('Local Business Reputation MCP Server'));
    console.log(chalk.bold('running on'), chalk.cyan(`http://localhost:${port}`));
    console.log(`  ${chalk.gray('Health:')} http://localhost:${port}/health`);
    console.log(`  ${chalk.gray('MCP:')}    http://localhost:${port}/mcp`);
    if (isDev) {
      console.log();
      console.log(chalk.gray('─'.repeat(50)));
      console.log();
    }
  });
}

main();
