import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
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
export class DrizzleExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DrizzleExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    if (this.isDrizzleError(exception)) {
      const { statusCode, message, errors } = this.mapDrizzleError(exception);
      response
        .status(statusCode)
        .json(
          this.createErrorResponse(statusCode, message, errors, request.url),
        );
      return;
    }

    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json(
          this.createErrorResponse(
            exception.getStatus(),
            exception.message,
            null,
            request.url,
          ),
        );
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error',
          null,
          request.url,
        ),
      );
  }

  private isDrizzleError(error: unknown): error is DatabaseErrorSchemaType {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'detail' in error
    );
  }

  private mapDrizzleError(error: DatabaseErrorSchemaType): {
    statusCode: number;
    message: string;
    errors: ErrorDetailsSchemaType[] | null;
  } {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let errors: ErrorDetailsSchemaType[] | null = null;

    switch (error.code) {
      case '23505':
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        errors = [
          {
            field: error.detail?.match(/\(([^)]+)\)=/)?.[1],
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
            field: error.column ?? undefined,
            message,
            code: 'DB_ERROR',
          },
        ];
        break;

      default:
        this.logger.error('Unknown Drizzle DB error', JSON.stringify(error));
    }

    return { statusCode, message, errors };
  }

  private createErrorResponse(
    statusCode: number,
    message: string,
    errors: ErrorDetailsSchemaType[] | null,
    path: string,
  ): BaseErrorResponseSchemaType {
    return {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
