import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';
import { loadTokens, saveTokens, type StoredTokens } from '../utils/token-storage.js';
import { GOOGLE_OAUTH_SCOPES, DEFAULT_REDIRECT_URI, ERROR_CODES } from '../utils/constants.js';

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  refreshToken?: string;
}

export class GoogleAuthService {
  private readonly oauth2Client: OAuth2Client;
  private authenticated = false;

  constructor(private readonly config: GoogleAuthConfig) {
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri ?? DEFAULT_REDIRECT_URI,
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [...GOOGLE_OAUTH_SCOPES],
      prompt: 'consent',
    });
  }

  async handleCallback(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const stored: StoredTokens = {
      access_token: tokens.access_token ?? '',
      refresh_token: tokens.refresh_token ?? '',
      expiry_date: tokens.expiry_date ?? 0,
      token_type: tokens.token_type ?? 'Bearer',
      scope: tokens.scope ?? GOOGLE_OAUTH_SCOPES.join(' '),
    };

    saveTokens(stored);
    this.authenticated = true;
    logger.info('OAuth authentication successful');
  }

  async initialize(): Promise<void> {
    // Try refresh token from env first (MCPize BYOK pattern)
    if (this.config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: this.config.refreshToken,
      });
      await this.refreshAccessToken();
      this.authenticated = true;
      logger.info('Authenticated via GOOGLE_REFRESH_TOKEN env var');
      return;
    }

    // Try loading from disk
    const tokens = loadTokens();
    if (!tokens) {
      logger.warn('No tokens found. Run authenticate script to set up Google access.');
      return;
    }

    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
    });

    // Refresh if expired
    if (this.isTokenExpired(tokens.expiry_date)) {
      await this.refreshAccessToken();
    }

    this.authenticated = true;
    logger.info('Authenticated via stored tokens');
  }

  async getAuthenticatedClient(): Promise<OAuth2Client> {
    if (!this.authenticated) {
      throw new AuthError(
        'Not authenticated. Run the authenticate script or provide GOOGLE_REFRESH_TOKEN.',
        ERROR_CODES.NOT_AUTHENTICATED,
      );
    }

    const credentials = this.oauth2Client.credentials;
    if (this.isTokenExpired(credentials.expiry_date ?? 0)) {
      await this.refreshAccessToken();
    }

    return this.oauth2Client;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  private isTokenExpired(expiryDate: number): boolean {
    // Consider expired 5 minutes before actual expiry
    return Date.now() >= expiryDate - 5 * 60 * 1000;
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      // Persist refreshed tokens
      const stored: StoredTokens = {
        access_token: credentials.access_token ?? '',
        refresh_token: credentials.refresh_token ?? this.oauth2Client.credentials.refresh_token ?? '',
        expiry_date: credentials.expiry_date ?? 0,
        token_type: credentials.token_type ?? 'Bearer',
        scope: credentials.scope ?? GOOGLE_OAUTH_SCOPES.join(' '),
      };

      saveTokens(stored);
      logger.info('Access token refreshed successfully');
    } catch (err) {
      this.authenticated = false;
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('invalid_grant') || message.includes('Token has been revoked')) {
        throw new AuthError(
          'Refresh token has been revoked. Please re-authenticate.',
          ERROR_CODES.TOKEN_REVOKED,
        );
      }

      throw new AuthError(
        `Failed to refresh access token: ${message}`,
        ERROR_CODES.TOKEN_EXPIRED,
      );
    }
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
