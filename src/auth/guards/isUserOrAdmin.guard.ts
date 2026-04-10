import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../role.enum';

@Injectable()
export class IsUserOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // support both :id and :userId route params
    const rawId = request.params.id ?? request.params.userId;
    const targetId = parseInt(rawId, 10);
    const userSub =
      typeof user.sub === 'string' ? parseInt(user.sub, 10) : user.sub;

    return user.role === UserRole.ADMIN || userSub === targetId;
  }
}
