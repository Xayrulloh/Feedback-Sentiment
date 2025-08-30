import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';

// Give proper Scopes to inject
@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const email = request.body?.email || request.user?.email;

    if (!email) {
      return true;
    }

    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, email),
    });

    if (!user) {
      return true;
    }

    if (user.isSuspended) {
      throw new ForbiddenException('User account is suspended');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account is disabled');
    }

    return true;
  }
}
