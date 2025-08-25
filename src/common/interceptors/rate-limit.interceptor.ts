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
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { RateLimitTargetEnum } from 'src/utils/zod.schemas';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const response = ctx.getResponse();
    const user = request.user;

    if (request.path.startsWith('/api/admin/rate-limit')) {
      return next.handle();
    }

    const userId = user?.id ?? request.ip;

    let action: RateLimitTargetEnum = RateLimitTargetEnum.API;

    if (request.path.startsWith('/api/feedback/upload')) {
      action = RateLimitTargetEnum.UPLOAD;
    } else if (request.path.startsWith('/api/feedback/report')) {
      action = RateLimitTargetEnum.DOWNLOAD;
    } else if (request.path.startsWith('/api/auth/login')) {
      action = RateLimitTargetEnum.LOGIN;
    }

    const [userCountRaw, rateLimitRaw] = await Promise.all([
      this.redisService.get(`user:${userId}:${action}`),
      this.redisService.get(`rateLimit:${action}`),
    ]);

    const userCount = userCountRaw ? parseInt(userCountRaw, 10) : 0;
    const rateLimit = rateLimitRaw ? JSON.parse(rateLimitRaw) : null;

    if (!rateLimit) {
      return next.handle();
    }

    const remaining = Math.max(rateLimit.limit - userCount, 0);
    const resetTimestamp = Math.floor(Date.now() / 1000) + rateLimit.duration;

    response.setHeader('X-RateLimit-Limit', rateLimit.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTimestamp);

    if (userCount >= rateLimit.limit) {
      // TODO: emit suspicious to websocket here
      throw new HttpException(
        `Rate limit exceeded for ${action}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (userCount === 0) {
      await this.redisService.setWithExpiry(
        `user:${userId}:${action}`,
        '1',
        rateLimit.duration,
      );
    } else {
      await this.redisService.set(
        `user:${userId}:${action}`,
        String(userCount + 1),
      );
    }

    return next.handle();
  }
}
