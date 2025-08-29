import { STATUS_CODES } from 'node:http';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Give proper Scopes to inject
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // TODO: take request first then response
    const [response, request] = [
      context.switchToHttp().getResponse<Response>(),
      context.switchToHttp().getRequest<Request>(),
    ];

    if (request.path === '/api/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        statusCode: response.statusCode,
        message: STATUS_CODES[response.statusCode] || 'OK',
        data,
        errors: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
