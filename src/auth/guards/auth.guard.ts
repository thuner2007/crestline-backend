import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../constants';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { KeycloakService } from '../keycloak.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private keycloakService: KeycloakService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (isPublic) {
      if (token) {
        try {
          const payload = await this.validateToken(token);
          request['user'] = payload;
        } catch {
          // Token is invalid/expired, but since endpoint is public, just continue without user
        }
      }
      return true;
    }

    // For protected endpoints, token is required
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.validateToken(token);
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid token',
      );
    }
    return true;
  }

  private async validateToken(
    token: string,
  ): Promise<{ sub: string; username: string; role: string }> {
    if (this.keycloakService.isKeycloakToken(token)) {
      const keycloakPayload = await this.keycloakService.verifyToken(token);
      const user =
        await this.usersService.findOrCreateByKeycloak(keycloakPayload);
      return { sub: user.id, username: user.username, role: user.role };
    }

    // Legacy token validation
    const payload = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });
    return payload;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
