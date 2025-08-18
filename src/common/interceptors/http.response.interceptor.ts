import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { ResponseType } from 'src/utils/zod.schemas';
import type { ZodTypeAny } from 'zod';
import { ZodError } from 'zod';

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
      catchError((err: any) => {
        const statusCode = this.getStatusCode(err);
        const { message, errors } = this.extractErrors(err);

        const errorResponse: ResponseType<T> = {
          statusCode,
          status: 'Error',
          message,
          errors,
          timestamp: Date.now(),
          path: request.url,
          data: null 
        };

        response.status(statusCode);
        return throwError(() => new HttpException(errorResponse, statusCode));
      }),
    );
  }

  private getStatusCode(err: any): number {
    if (err instanceof HttpException) return err.getStatus();
    if (err instanceof ZodError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private extractErrors(err: any): { message: string; errors: string[] } {
    if (err instanceof ZodError) {
      return {
        message: 'Validation failed',
        errors: err.errors.map((e) => e.message),
      };
    }

    if (err instanceof HttpException) {
      const response = err.getResponse() as any;

      const errorArray = Array.isArray(response?.message)
        ? response.message
        : Array.isArray(response?.errors)
          ? response.errors
          : typeof response?.message === 'string'
            ? [response.message]
            : [err.message];

      return {
        message: err.message,
        errors: errorArray,
      };
    }

    return {
      message: 'Internal server error',
      errors: [err.message || 'An unexpected error occurred'],
    };
  }
}
