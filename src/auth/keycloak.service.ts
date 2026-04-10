import { Injectable, Logger } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { keycloakConstants } from './keycloak.constants';

export interface KeycloakTokenPayload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  scope?: string;
  iss: string;
  exp: number;
  aud?: string | string[];
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);

  private readonly jwksClient: JwksClient;

  constructor() {
    this.jwksClient = new JwksClient({
      jwksUri: keycloakConstants.jwksUri,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async verifyToken(token: string): Promise<KeycloakTokenPayload> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token: could not decode');
    }

    const kid = decoded.header.kid;
    if (!kid) {
      throw new Error('Invalid token: missing kid in header');
    }

    const signingKey = await this.jwksClient.getSigningKey(kid);
    const publicKey = signingKey.getPublicKey();

    // Verify with RS256 and issuer check.
    // Audience check is conditional — Keycloak doesn't always set aud to the client ID.
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],
      issuer: keycloakConstants.issuer,
    };

    const payload = jwt.verify(
      token,
      publicKey,
      verifyOptions,
    ) as KeycloakTokenPayload;

    // If audience is present, verify it contains the expected client ID
    if (payload.aud) {
      const audiences = Array.isArray(payload.aud)
        ? payload.aud
        : [payload.aud];
      if (
        !audiences.includes(keycloakConstants.clientId) &&
        !audiences.includes('account')
      ) {
        this.logger.warn(
          `Keycloak token audience mismatch: expected "${keycloakConstants.clientId}", got ${JSON.stringify(payload.aud)}`,
        );
      }
    }

    return payload;
  }

  isKeycloakToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as { iss?: string } | null;
      return decoded?.iss === keycloakConstants.issuer;
    } catch {
      return false;
    }
  }
}
