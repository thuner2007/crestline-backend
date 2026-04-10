import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { KeycloakService } from './keycloak.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private refreshTokens: Map<string, string> = new Map();
  // Constants for token expiration - can be set in seconds, minutes, hours, or days
  private readonly ACCESS_TOKEN_EXPIRATION = '3d'; // e.g., '15m', '2h', '1d'
  private readonly REFRESH_TOKEN_EXPIRATION = '7d'; // e.g., '30m', '12h', '7d'

  // Helper method to convert time string to milliseconds
  private getExpirationInMs(timeString: string): number {
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Invalid time format: ${timeString}. Use format like '15m', '2h', '1d'`,
      );
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  private get ACCESS_TOKEN_EXPIRATION_MS(): number {
    return this.getExpirationInMs(this.ACCESS_TOKEN_EXPIRATION);
  }

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private keycloakService: KeycloakService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRATION,
      }),
    ]);
    this.refreshTokens.set(user.id.toString(), refresh_token);

    return {
      access_token,
      refresh_token,
      accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRATION_MS,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const storedToken = this.refreshTokens.get(payload.sub.toString());

      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        role: payload.role,
      };

      const [access_token, refresh_token] = await Promise.all([
        this.jwtService.signAsync(newPayload, {
          expiresIn: this.ACCESS_TOKEN_EXPIRATION,
        }),
        this.jwtService.signAsync(newPayload, {
          expiresIn: this.REFRESH_TOKEN_EXPIRATION,
        }),
      ]);
      this.refreshTokens.set(payload.sub.toString(), refresh_token);

      return {
        access_token,
        refresh_token,
        accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRATION_MS,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async keycloakTokenExchange(keycloakAccessToken: string) {
    const keycloakPayload =
      await this.keycloakService.verifyToken(keycloakAccessToken);
    const user =
      await this.usersService.findOrCreateByKeycloak(keycloakPayload);

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRATION,
      }),
    ]);
    this.refreshTokens.set(user.id.toString(), refresh_token);

    return {
      access_token,
      refresh_token,
      accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRATION_MS,
    };
  }
}
