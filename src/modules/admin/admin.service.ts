import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  RateLimitSchemaType,
  UserSchemaType,
} from 'src/utils/zod.schemas';
// biome-ignore lint/style/useImportType: Needed for DI
import { RedisService } from '../redis/redis.service';
import type {
  RateLimitGetSchemaType,
  RateLimitUpsertDto,
  SuspiciousActivityResponseSchemaType,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly redisService: RedisService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async adminDisable(userId: string): Promise<UserSchemaType> {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot disable an admin user');
    }

    const [disabledUser] = await this.db
      .update(schema.usersSchema)
      .set({ isDisabled: !user.isDisabled })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return disabledUser;
  }

  async adminSuspend(userId: string): Promise<UserSchemaType> {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot suspend an admin user');
    }

    const [suspendedUser] = await this.db
      .update(schema.usersSchema)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return suspendedUser;
  }

  async adminUpsertRateLimit(
    body: RateLimitUpsertDto,
  ): Promise<RateLimitSchemaType> {
    const [upsertedRateLimit] = await this.db
      .insert(schema.rateLimitsSchema)
      .values(body)
      .onConflictDoUpdate({
        target: schema.rateLimitsSchema.target,
        set: body,
      })
      .returning();

    await this.redisService.set(
      `rateLimit:${body.target}`,
      JSON.stringify({
        limit: body.limit,
      }),
    );

    return upsertedRateLimit;
  }

  async adminGetRateLimits(): Promise<RateLimitGetSchemaType> {
    return this.db.select().from(schema.rateLimitsSchema);
  }

  async adminGetSuspiciousActivities(): Promise<SuspiciousActivityResponseSchemaType> {
    return this.db.select().from(schema.suspiciousActivitySchema);
  }
}
