import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  ApiErrorResponseSchemaType,
  ApiSuccessResponseSchemaType,
} from 'src/utils/zod.schemas';
import { ZodError } from 'zod';

interface ErrorDetail {
  path?: (string | number)[];
  field?: string;
  message?: string;
  code?: string;
}

interface DatabaseError {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  column?: string;
}

@Injectable()
export class HttpResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponseSchemaType<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponseSchemaType<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => this.formatSuccess(data, response)),
      catchError((error: unknown) => this.formatError(error, response)),
    );
  }

  private formatSuccess(
    data: T,
    response: Response,
  ): ApiSuccessResponseSchemaType<T> {
    return {
      success: true,
      statusCode: response.statusCode,
      message: this.getSuccessMessage(response.statusCode),
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private formatError(error: unknown, response: Response): Observable<never> {
    const { statusCode, message, errors } = this.parseError(error);

    const errorResponse: ApiErrorResponseSchemaType = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode);
    return throwError(() => new HttpException(errorResponse, statusCode));
  }

  private parseError(error: unknown) {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();

      if (
        typeof response === 'object' &&
        response !== null &&
        'errors' in response &&
        Array.isArray((response as { errors: unknown }).errors)
      ) {
        const errors = (response as { errors: ErrorDetail[] }).errors.map(
          (err) => ({
            field: Array.isArray(err.path)
              ? err.path.join('.')
              : err.field || 'unknown',
            message: err.message || 'Unknown error',
            code: err.code?.toUpperCase() || 'UNKNOWN',
          }),
        );

        return {
          statusCode: status,
          message:
            (response as { message?: string }).message || 'Validation failed',
          errors,
        };
      }

      return {
        statusCode: status,
        message: typeof response === 'string' ? response : error.message,
      };
    }

    if (error instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : 'root',
          message: issue.message,
          code: issue.code.toUpperCase(),
        })),
      };
    }

    if (this.isDatabaseError(error)) {
      const dbError = this.parseDatabaseError(error);
      return {
        statusCode: dbError.statusCode,
        message: dbError.message,
        errors: dbError.field
          ? [
              {
                field: dbError.field,
                message: dbError.message,
                code: 'DB_ERROR',
              },
            ]
          : undefined,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Success',
      201: 'Created successfully',
      204: 'No content',
    };
    return messages[statusCode] || 'Success';
  }

  private isDatabaseError(error: unknown): error is DatabaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error ||
        'constraint' in error ||
        'detail' in error ||
        'table' in error)
    );
  }

  private parseDatabaseError(error: DatabaseError) {
    const code = error.code;

    switch (code) {
      case '23505': // Unique violation
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          field: this.extractFieldFromDetail(error.detail),
        };

      case '23503': // Foreign key violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced resource does not exist',
        };

      case '23502': // Not null violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required field missing',
          field: error.column,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
        };
    }
  }

  private extractFieldFromDetail(detail?: string): string | undefined {
    if (!detail) return undefined;
    const match = detail.match(/Key \((.+?)\)=/);
    return match?.[1];
  }
}
