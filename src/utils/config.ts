import { z } from 'zod';
import { logger } from './logger.js';

const configSchema = z.object({
  OUTSCRAPER_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_MOCK_MODE: z.coerce.boolean().default(false),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`
    );
    logger.error('Invalid configuration', { errors });
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function validateEnvironment(): void {
  getConfig();
  logger.info('Configuration validated successfully');
}
