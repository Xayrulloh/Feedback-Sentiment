import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  BaseErrorResponseSchemaType,
  DatabaseErrorSchemaType,
  ErrorDetailsSchemaType,
} from 'src/utils/zod.schemas';

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseErrorSchemaType, host: ArgumentsHost): void {
    Logger.error(exception, DatabaseExceptionFilter.name);

    const [response, request] = [
      host.switchToHttp().getResponse<Response>(),
      host.switchToHttp().getRequest<Request>(),
    ];

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let errors: ErrorDetailsSchemaType[] | null = null;

    if (this.isDatabaseError(exception)) {
      switch (exception.code) {
        case '23505': // Unique violation
          statusCode = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          errors = [
            {
              field: this.extractFieldFromDetail(exception.detail),
              message,
              code: 'DB_ERROR',
            },
          ];

          break;
        case '23503': // Foreign key violation
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Referenced resource does not exist';

          break;
        case '23502': // Not null violation
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Required field missing';
          errors = [
            {
              field: exception.column,
              message,
              code: 'DB_ERROR',
            },
          ];

          break;

        default:
          Logger.error('DB unknown error');
      }
    }

    const errorResponse: BaseErrorResponseSchemaType = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private isDatabaseError(error: unknown): error is DatabaseErrorSchemaType {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error || 'constraint' in error || 'detail' in error)
    );
  }

  private extractFieldFromDetail(detail?: string): string | undefined {
    if (!detail) {
      return undefined;
    }

    const match = detail.match(/Key \((.+?)\)=/);

    return match?.[1];
  }
}
