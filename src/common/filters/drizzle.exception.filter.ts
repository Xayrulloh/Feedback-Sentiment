import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorDetailsSchemaType } from 'src/utils/zod.schemas';
import { DatabaseError } from 'pg';
import { createBaseErrorResponse } from 'src/helpers/base-error-response.helper';

@Catch(DatabaseError)
export class DrizzleExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseError, host: ArgumentsHost): void {
    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let errors: ErrorDetailsSchemaType[] | null = null;

    switch (exception.code as string) {
      case '23505':
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        errors = [
          {
            field: exception.detail?.match(/\(([^)]+)\)=/)?.[1],
            message,
            code: 'DB_ERROR',
          },
        ];
        break;

      case '23503':
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource does not exist';
        break;

      case '23502':
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Required field missing';
        errors = [
          {
            field: exception.column ?? undefined,
            message,
            code: 'DB_ERROR',
          },
        ];
        break;

      default:
        Logger.error('Unknown Drizzle DB error', JSON.stringify(exception));
    }

    response
      .status(statusCode)
      .json(createBaseErrorResponse(statusCode, message, errors, request.url));
  }
}
