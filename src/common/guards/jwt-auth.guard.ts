import {
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleEnum, type UserSchemaType } from 'src/utils/zod.schemas';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly requiredRole: UserRoleEnum | null = null) {
    super();
  }

  handleRequest<TUser extends UserSchemaType = UserSchemaType>(
    err: unknown,
    user: TUser | null,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    if (this.requiredRole && user.role !== this.requiredRole) {
      throw new UnauthorizedException(
        `Access denied. ${this.requiredRole} role required.`,
      );
    }

    return user;
  }
}

@Injectable()
export class JwtAnyAuthGuard extends JwtAuthGuard {
  constructor() {
    super(null);
  }
}

@Injectable()
export class JwtAdminAuthGuard extends JwtAuthGuard {
  constructor() {
    super(UserRoleEnum.ADMIN);
  }
}
