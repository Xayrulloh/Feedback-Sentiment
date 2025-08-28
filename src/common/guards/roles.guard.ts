import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/modules/auth/decorators/roles.decorator';
import type { UserRoleEnum } from 'src/utils/zod.schemas';

// Give proper Scopes to inject
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles.length) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return requiredRoles.includes(user.role);
  }
}
