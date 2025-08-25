import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
// biome-ignore lint/style/useImportType: Needed for DI
import { AdminService } from 'src/modules/admin/admin.service';
import type { RedisService } from 'src/modules/redis/redis.service';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly adminService: AdminService,
    private readonly redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const [request, response] = [
      ctx.getRequest<AuthenticatedRequest>(),
      ctx.getResponse<Response>(),
    ];
    const user = request.user;

    const [
      userApiRateLimit,
      userUploadRateLimit,
      userDownloadRateLimit,
      userLoginRateLimit,
      rateLimitApi, // {duration: ms, limit: number}
      rateLimitUpload,
      rateLimitDownload,
      rateLimitLogin,
    ] = await Promise.all([
      this.redisService.get(`user:${user.id}:api`),
      this.redisService.get(`user:${user.id}:upload`),
      this.redisService.get(`user:${user.id}:download`),
      this.redisService.get(`user:${user.id}:login`),
      this.redisService.get('rateLimit:api'),
      this.redisService.get('rateLimit:upload'),
      this.redisService.get('rateLimit:download'),
      this.redisService.get('rateLimit:login'),
    ]);

    // check what user is trying to do
    if (request.path === '/api/upload') {
      if (!userUploadRateLimit) {
        await this.redisService.setWithExpiry(
          `user:${user.id}:upload`,
          1,
          rateLimitUpload.duration,
        );
      }
    }

    // redis (store it like: {user:{userId}:{target} duration as TTL)

    // 429

    // QN:
    // take user limits from redis
    // take db limits from redis
    // compare them
    // if they are the same or higher, return 429 and suspicious emit to websocket
  }
}
