import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  RateLimitGetSchemaType,
  RateLimitUpsertDto,
} from './dto/admin.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { RedisService } from '../redis/redis.service';
import { RateLimitDurationEnum } from 'src/utils/zod.schemas';

@Injectable()
export class AdminService {
  constructor(
    private readonly redisService: RedisService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async adminDisable(userId: string) {
    // FIXME: implement response type for all controllers and services
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [disabledUser] = await this.db
      .update(schema.usersSchema)
      .set({ isDisabled: !user.isDisabled })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return disabledUser;
  }

  async adminSuspend(userId: string) {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
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

  async adminUpsertRateLimit(body: RateLimitUpsertDto) {
    const [upsertedRateLimit] = await this.db
      .insert(schema.rateLimitsSchema)
      .values(body)
      .onConflictDoUpdate({
        target: schema.rateLimitsSchema.target,
        set: body,
      })
      .returning();

const durationInSeconds =
    upsertedRateLimit.duration === RateLimitDurationEnum.HOUR ? 60 : 86400;

 await this.redisService.set(
      `rateLimit:${upsertedRateLimit.target}`,
      JSON.stringify({
      limit: upsertedRateLimit.limit,
      duration: durationInSeconds,
  })
);

  const userKeys = await this.redisService.keys(`user:*:${upsertedRateLimit.target}`);
  for (const key of userKeys) {
    await this.redisService.delete(key);
  }

    return upsertedRateLimit;
  }

  async adminGetRateLimits(): Promise<RateLimitGetSchemaType> {
    return this.db.select().from(schema.rateLimitsSchema);
  }
}