/**
 * One-time OAuth setup script.
 *
 * Run: npx tsx authenticate.ts
 *
 * Opens browser to Google consent, catches callback, saves tokens.
 */

import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { OAuth2Client } from 'google-auth-library';
import { config } from 'dotenv';
import { saveTokens, type StoredTokens } from './src/utils/token-storage.js';
import { GOOGLE_OAUTH_SCOPES } from './src/utils/constants.js';

config(); // Load .env

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [...GOOGLE_OAUTH_SCOPES],
  prompt: 'consent',
});

const redirectUrl = new URL(REDIRECT_URI);
const port = parseInt(redirectUrl.port || '3000', 10);
const callbackPath = redirectUrl.pathname;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  if (url.pathname !== callbackPath) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authentication Failed</h1><p>${error}</p>`);
    console.error(`Authentication error: ${error}`);
    shutdown(1);
    return;
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Missing authorization code</h1>');
    shutdown(1);
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const stored: StoredTokens = {
      access_token: tokens.access_token ?? '',
      refresh_token: tokens.refresh_token ?? '',
      expiry_date: tokens.expiry_date ?? 0,
      token_type: tokens.token_type ?? 'Bearer',
      scope: tokens.scope ?? GOOGLE_OAUTH_SCOPES.join(' '),
    };

    saveTokens(stored);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>Authentication Successful!</h1>
      <p>Your Google Business Profile is now connected.</p>
      <p>You can close this window and return to your terminal.</p>
    `);

    console.log('\nAuthentication successful! Tokens saved.');
    console.log('You can now start the MCP server.');
    shutdown(0);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Token Exchange Failed</h1><p>${err instanceof Error ? err.message : String(err)}</p>`);
    console.error('Token exchange failed:', err);
    shutdown(1);
  }
});

function shutdown(exitCode: number): void {
  server.close(() => process.exit(exitCode));
  // Force close after 3 seconds
  setTimeout(() => process.exit(exitCode), 3000);
}

server.listen(port, () => {
  console.log(`\nLocal auth server listening on port ${port}`);
  console.log('Opening browser for Google authentication...\n');
  open(authUrl);
});
