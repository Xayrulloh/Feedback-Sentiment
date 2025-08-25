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
import { AdminService } from 'src/modules/admin/admin.service';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly adminService: AdminService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const subject = request.user
      ? `user:${request.user.id}`
      : `ip:${request.ip}`;
    const { allowed, remaining, limit } =
      await this.adminService.enforce(subject);

    // Ensure headers are valid
    const safeLimit =
      limit != null && Number.isFinite(limit) ? String(limit) : 'unlimited';
    const safeRemaining =
      remaining != null && Number.isFinite(remaining)
        ? String(remaining)
        : 'unlimited';

    response.setHeader('X-RateLimit-Limit', safeLimit);
    response.setHeader('X-RateLimit-Remaining', safeRemaining);

    if (!allowed) {
      throw new HttpException(
        {
          success: false,
          statusCode: 429,
          message: 'Too Many Requests',
          timestamp: new Date().toISOString(),
          path: request.originalUrl || request.url,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
