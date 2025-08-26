import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
// biome-ignore lint/style/useImportType: Needed for DI
import { RedisService } from 'src/modules/redis/redis.service';
// biome-ignore lint/style/useImportType: Needed for DI
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
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly gateaway: SocketGateway,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const response = ctx.getResponse();
    const user = request.user;
    const ip = request.ip;

    if (user?.role === UserRoleEnum.ADMIN) {
      return next.handle();
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
      return next.handle();
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
        email: user?.email,
        error: `TOO_MANY_${action}` as RateLimitErrorEnum,
        details: `TOO_MANY_${action} requests for limit: ${rateLimit}`,
        timestamp: new Date(),
      };

      this.gateaway.notifyAdmin({
        event: 'suspiciousActivity',
        data: event,
      });

      throw new HttpException(
        `Rate limit exceeded for ${action}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (userCount === 0) {
      await this.redisService.setWithExpiry(
        `user:${user.id}:${action}`,
        '1',
        rateLimit.limit * HOUR_SECONDS,
      );
    } else {
      await this.redisService.set(
        `user:${user.id}:${action}`,
        String(userCount + 1),
      );
    }

    return next.handle();
  }
}
