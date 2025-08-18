import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ResponseType } from 'src/utils/zod.schemas';
import type { ZodTypeAny } from 'zod';

@Injectable()
export class HttpResponseInterceptor<T extends ZodTypeAny>
  implements NestInterceptor<T, ResponseType<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseType<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        const statusCode = response.statusCode;

        return {
          statusCode,
          message: statusCode >= 400 ? 'Error' : 'Success',
          errors: null,
          timestamp: Date.now(),
          path: request.url,
          data: data as T,
        } as ResponseType<T>;
      }),
      // catchError((err: any) => {
      //   const statusCode =
      //     err instanceof HttpException
      //       ? err.getStatus()
      //       : HttpStatus.INTERNAL_SERVER_ERROR;

      //   const errorMessage =
      //     err instanceof HttpException ? err.message : 'Internal server error';

      //   const errorName =
      //     err instanceof HttpException ? err.name : 'InternalServerError';

      //   const errorResponse: ResponseType<{}> = {
      //     statusCode,
      //     message: errorMessage,
      //     error: errorName,
      //     timestamp: Date.now(),
      //     version: 'v2',
      //     path: request.url,
      //     data: {},
      //   };

      //   // Log the error for debugging
      //   console.error('Response Interceptor Error:', {
      //     statusCode,
      //     message: errorMessage,
      //     path: request.url,
      //     stack: err.stack,
      //   });

      //   return throwError(() => new HttpException(errorResponse, statusCode));
      // }),
    );
  }
}
