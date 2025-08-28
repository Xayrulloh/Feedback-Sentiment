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

    if (user.isDisabled) {
      throw new ForbiddenException('User account is disabled');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account is suspended');
    }

    return true;
  }
}
