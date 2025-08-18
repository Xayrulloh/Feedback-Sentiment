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
        const isError = statusCode >= 400;

        return {
          statusCode,
          status: isError ? 'Error' : 'Success',
          message: isError ? 'Request failed' : 'Request successful',
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

      //   // Extract error details if available
      //   const errorDetails =
      //     err instanceof HttpException ? err.getResponse() : null;

      //   const errors = Array.isArray(errorDetails?.message)
      //     ? errorDetails.message
      //     : errorDetails?.message
      //       ? [errorDetails.message]
      //       : [errorMessage];

      //   const errorResponse: ResponseType<{}> = {
      //     statusCode,
      //     status: 'Error',
      //     message: errorMessage,
      //     errors,
      //     timestamp: Date.now(),
      //     path: request.url,
      //     data: {} as T,
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
