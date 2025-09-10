import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  RateLimitSchemaType,
  UserSchemaType,
} from 'src/utils/zod.schemas';
import { RedisService } from '../redis/redis.service';
import type {
  RateLimitGetDto,
  RateLimitUpsertDto,
  SuspiciousActivityQueryDto,
  SuspiciousActivityResponseDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly redisService: RedisService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async adminDisable(userId: string): Promise<UserSchemaType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot disable an admin user');
    }

    const [disabledUser] = await this.db
      .update(schema.usersSchema)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return disabledUser;
  }

  async adminSuspend(userId: string): Promise<UserSchemaType> {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot suspend an admin user');
    }

    const [suspendedUser] = await this.db
      .update(schema.usersSchema)
      .set({ isSuspended: !user.isSuspended })
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

  async adminGetRateLimits(): Promise<RateLimitGetDto> {
    return this.db.query.rateLimitsSchema.findMany();
  }

  async adminGetSuspiciousActivities(
    query: SuspiciousActivityQueryDto,
  ): Promise<SuspiciousActivityResponseDto> {
    const { limit, page } = query;

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.suspiciousActivitySchema);

    const total = totalResult[0]?.count ?? 0;

    const activities = await this.db.query.suspiciousActivitySchema.findMany({
      limit,
      offset: (page - 1) * limit,
      orderBy: desc(schema.suspiciousActivitySchema.createdAt),
    });

    return {
      activities,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }
}
