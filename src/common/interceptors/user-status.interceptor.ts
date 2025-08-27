import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  type NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Observable } from 'rxjs';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class UserStatusInterceptor implements NestInterceptor {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const dbUser = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, user.email),
    });

    if (!dbUser) {
      return next.handle();
    }

    if (dbUser.deletedAt) {
      throw new UnauthorizedException('User account is suspended');
    }

    if (dbUser.isDisabled) {
      throw new ForbiddenException('User account is disabled');
    }

    return next.handle();
  }
}
