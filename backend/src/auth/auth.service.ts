import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class AuthService {
  private readonly jwks = createRemoteJWKSet(
    new URL(process.env.SUPABASE_JWKS_URL ?? `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  );

  async verifyBearer(token?: string): Promise<JWTPayload> {
    if (!token) throw new UnauthorizedException('Missing bearer token');
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL}/auth/v1`,
    });
    return payload;
  }
}
