import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { jwtVerify, JWTPayload, importJWK, JWK } from 'jose';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwksUrl: string;
  private readonly issuer: string;
  private verifiedKeys: Map<string, any> = new Map();
  private keys: JWK[] = [];

  constructor() {
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      '';

    this.jwksUrl =
      process.env.SUPABASE_JWKS_URL ??
      `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    this.issuer = `${supabaseUrl}/auth/v1`;
  }

  async onModuleInit() {
    await this.fetchAndImportJwks();
  }

  private async fetchAndImportJwks() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch(this.jwksUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`JWKS fetch returned ${response.status}`);
      }

      const body: { keys: JWK[] } = await response.json();

      if (!body || !Array.isArray(body.keys) || body.keys.length === 0) {
        throw new Error('Invalid JWKS response: empty keys array');
      }

      this.keys = body.keys;

      // Import all keys and store by kid
      for (const key of body.keys) {
        const importedKey = await importJWK(key);
        this.verifiedKeys.set(key.kid ?? 'default', importedKey);
      }

      this.logger.log(`JWKS loaded successfully with ${body.keys.length} key(s)`);
    } catch (error) {
      this.logger.error(`Failed to load JWKS: ${(error as Error).message}`);
      throw new Error(
        `Authentication is unavailable - failed to load signing keys: ${(error as Error).message}`,
      );
    }
  }

  async verifyBearer(token?: string): Promise<JWTPayload> {
    if (!token) throw new UnauthorizedException('Missing bearer token');

    // Extract kid from the JWT header to pick the right key
    let kid: string | undefined;
    try {
      const header = JSON.parse(
        Buffer.from(token.split('.')[0], 'base64url').toString(),
      );
      kid = header.kid;
    } catch {
      throw new UnauthorizedException('Invalid token format');
    }

    const key = kid ? this.verifiedKeys.get(kid) : this.verifiedKeys.get('default') ?? this.verifiedKeys.values().next().value;

    if (!key) {
      // If kid not found, try each key
      for (const [, candidateKey] of this.verifiedKeys) {
        try {
          const { payload } = await jwtVerify(token, candidateKey, {
            issuer: this.issuer,
          });
          return payload;
        } catch {
          continue;
        }
      }
      throw new UnauthorizedException('No matching key found to verify token');
    }

    const { payload } = await jwtVerify(token, key, {
      issuer: this.issuer,
    });

    return payload;
  }
}