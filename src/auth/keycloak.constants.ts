import * as dotenv from 'dotenv';
dotenv.config();

export const keycloakConstants = {
  issuer:
    process.env.KEYCLOAK_ISSUER || 'https://auth.revsticks.ch/realms/revsticks',
  jwksUri:
    process.env.KEYCLOAK_JWKS_URI ||
    'https://auth.revsticks.ch/realms/revsticks/protocol/openid-connect/certs',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'revsticks-onlineshop',
};
