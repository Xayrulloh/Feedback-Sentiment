import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { RedisService } from 'src/modules/redis/redis.service';
import { SocketGateway } from 'src/modules/websocket/websocket.gateaway';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { HOUR_SECONDS } from 'src/utils/constants';
import {
  type RateLimitErrorEnum,
  type RateLimitEventSchemaType,
  RateLimitTargetEnum,
  UserRoleEnum,
} from 'src/utils/zod.schemas';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly gateaway: SocketGateway,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();

    const [request, response] = [
      ctx.getRequest<AuthenticatedRequest>(),
      ctx.getResponse(),
    ];

    const { user, ip } = request;

    if (
      user?.role === UserRoleEnum.ADMIN ||
      (request.method === 'GET' &&
        !request.path.startsWith('/api/feedback/report'))
    ) {
      return true;
    }

    let action: RateLimitTargetEnum = RateLimitTargetEnum.API;

    if (request.path.startsWith('/api/feedback/upload')) {
      action = RateLimitTargetEnum.UPLOAD;
    } else if (request.path.startsWith('/api/feedback/report')) {
      action = RateLimitTargetEnum.DOWNLOAD;
    } else if (request.path.startsWith('/api/auth/login')) {
      action = RateLimitTargetEnum.LOGIN;
    }

    const keyIdentifier = user ? `user:${user.id}` : `ip:${ip}`;
    const redisKey = `${keyIdentifier}:${action}`;

    const [userCountRaw, rateLimitRaw] = await Promise.all([
      this.redisService.get(redisKey),
      this.redisService.get(`rateLimit:${action}`),
    ]);

    const userCount = userCountRaw ? parseInt(userCountRaw, 10) : 0;
    const rateLimit = rateLimitRaw ? JSON.parse(rateLimitRaw) : null;

    if (!rateLimit) {
      return true;
    }

    const remaining = Math.max(rateLimit.limit - userCount, 0);
    const resetTimestamp =
      Math.floor(Date.now() / 1000) + rateLimit.limit * HOUR_SECONDS;

    response.setHeader('X-RateLimit-Limit', rateLimit.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTimestamp);

    if (userCount >= rateLimit.limit) {
      const event: RateLimitEventSchemaType = {
        userId: user?.id,
        ip: ip,
        email: user?.email,
        action: action,
        error: `TOO_MANY_${action}` as RateLimitErrorEnum,
        details: `User ${user?.email ?? 'Unauthorized user'} (ID: ${user?.id ?? 'N/A'}, IP: ${ip}) exceeded rate limit for ${action}. 
              Allowed: ${rateLimit.limit}, Reached: ${userCount}.`,
        timestamp: new Date(),
      };

      this.gateaway.notifyAdmin({
        event: 'suspiciousActivity',
        data: event,
      });

      await this.db.insert(schema.suspiciousActivitySchema).values(event);

      throw new HttpException(
        `Rate limit exceeded for ${action}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (userCount === 0) {
      await this.redisService.setWithExpiry(
        redisKey,
        '1',
        rateLimit.limit * HOUR_SECONDS,
      );
    } else {
      await this.redisService.set(redisKey, String(userCount + 1));
    }

    return true;
  }
}
