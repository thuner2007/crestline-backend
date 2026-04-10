import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_USER_KEY } from '../decorators/isUser.decorator';

@Injectable()
export class IsUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isUser = this.reflector.getAllAndOverride<boolean>(IS_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isUser) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const paramId = parseInt(request.params.id);

    if (!user || user.sub !== paramId) {
      throw new ForbiddenException('You can only modify your own account');
    }

    return true;
  }
}
