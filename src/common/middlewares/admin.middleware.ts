import {
  ForbiddenException,
  Inject,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { NextFunction, Response } from 'express';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, req.body?.email || req.user?.email)
    })

    console.log(user)

    if (!user) {
      return next()
    }
  
    if (user.isDisabled) {
      throw new UnauthorizedException('User account is disabled');
    }
  
    if (user.deletedAt) {
      throw new ForbiddenException('User account is suspended');
    }
  
    next();
  }
  
}
