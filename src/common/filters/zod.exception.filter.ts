import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createBaseErrorResponse } from 'src/utils/helpers';
import type {
  BaseErrorResponseSchemaType,
  ErrorDetailsSchemaType,
} from 'src/utils/zod.schemas';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    Logger.error(exception.message, ZodExceptionFilter.name);

    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    const issues: ErrorDetailsSchemaType[] = exception.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'root',
      message: issue.message,
      code: issue.code.toUpperCase(),
    }));

    const errorResponse: BaseErrorResponseSchemaType & {
      errors?: ErrorDetailsSchemaType[];
    } = createBaseErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Validation failed',
      issues,
      request.url,
    );

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
