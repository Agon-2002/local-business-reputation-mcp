import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { logger } from './logger.js';
import { TOKEN_STORAGE_DIR, TOKEN_FILE_NAME } from './constants.js';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

function getTokenDir(): string {
  return join(homedir(), TOKEN_STORAGE_DIR);
}

function getTokenPath(): string {
  return join(getTokenDir(), TOKEN_FILE_NAME);
}

export function loadTokens(): StoredTokens | null {
  const tokenPath = getTokenPath();

  if (!existsSync(tokenPath)) {
    logger.debug('No token file found', { path: tokenPath });
    return null;
  }

  try {
    const raw = readFileSync(tokenPath, 'utf-8');
    const tokens = JSON.parse(raw) as StoredTokens;

    if (!tokens.access_token || !tokens.refresh_token) {
      logger.warn('Token file exists but is missing required fields');
      return null;
    }

    return tokens;
  } catch (err) {
    logger.error('Failed to read token file', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function saveTokens(tokens: StoredTokens): void {
  const tokenDir = getTokenDir();
  const tokenPath = getTokenPath();

  if (!existsSync(tokenDir)) {
    mkdirSync(tokenDir, { recursive: true, mode: 0o700 });
  }

  writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });

  logger.info('Tokens saved successfully', { path: tokenPath });
}

export function clearTokens(): void {
  const tokenPath = getTokenPath();

  if (existsSync(tokenPath)) {
    writeFileSync(tokenPath, '', { encoding: 'utf-8' });
    logger.info('Tokens cleared');
  }
}
