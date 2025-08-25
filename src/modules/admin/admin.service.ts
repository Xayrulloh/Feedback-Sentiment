import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Request } from 'express';
import Redis from 'ioredis';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

export interface GlobalRateLimitConfig {
  limit: number;
  windowSeconds: number;
}

@Injectable()
export class AdminService {
  private readonly redis: Redis;
  private readonly logger = new Logger(AdminService.name);
  private readonly CONFIG_KEY = 'rl:global:config';
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'redis',
      port: +(process.env.REDIS_PORT ?? 6379),
    });
  }

  async adminDisable(userId: string) {
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

  async setGlobalRule(
    config: GlobalRateLimitConfig,
  ): Promise<GlobalRateLimitConfig> {
    if (config.limit <= 0 || config.windowSeconds <= 0) {
      throw new Error('limit and windowSeconds must be > 0');
    }

    try {
      await this.redis.hset(this.CONFIG_KEY, {
        limit: String(config.limit),
        windowSeconds: String(config.windowSeconds),
      });
      return config;
    } catch (err) {
      this.logger.error('Failed to set global rate limit', err);
      throw new HttpException('Failed to update rate limit', 500);
    }
  }

  async getGlobalRule(): Promise<GlobalRateLimitConfig | null> {
    try {
      const data = await this.redis.hgetall(this.CONFIG_KEY);
      this.logger.debug(`Global rule data from Redis: ${JSON.stringify(data)}`);

      const limit = Number(data.limit);
      const windowSeconds = Number(data.windowSeconds);

      if (
        !Number.isFinite(limit) ||
        limit <= 0 ||
        !Number.isFinite(windowSeconds) ||
        windowSeconds <= 0
      ) {
        return null;
      }

      return { limit, windowSeconds };
    } catch (err) {
      this.logger.error('Failed to get global rule from Redis', err);
      throw new HttpException('Failed to read rate limit config', 500);
    }
  }

  private cntKey(subject: string) {
    return `rl:cnt:global:${subject}`;
  }

  async enforce(subject: string) {
    try {
      const rule = await this.getGlobalRule();
      if (!rule) return { allowed: true, used: 0, remaining: 0, limit: 0 };

      const key = this.cntKey(subject);
      const used = await this.redis.incr(key);
      if (used === 1) {
        await this.redis.expire(key, rule.windowSeconds);
      }

      const allowed = used <= rule.limit;
      const remaining = Math.max(0, rule.limit - used);

      if (used > rule.limit * 5) {
        this.logger.warn(`Suspicious rate: subject=${subject} used=${used}`);
      }

      return { allowed, used, remaining, limit: rule.limit };
    } catch (err) {
      this.logger.error(
        `Failed to enforce rate limit for subject=${subject}`,
        err,
      );
      throw new HttpException('Rate limit enforcement failed', 500);
    }
  }

  normalizePath(req: Request) {
    const u = req.originalUrl || req.url;
    return u.split('?')[0].replace(/\/+$/, '') || '/';
  }
}
