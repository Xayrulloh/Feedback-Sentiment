import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  BaseErrorResponseSchemaType,
  ErrorDetailsSchemaType,
} from 'src/utils/zod.schemas';

interface HttpErrorResponse {
  message?: string;
  errors?: ErrorDetailsSchemaType[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    Logger.error(exception, HttpExceptionFilter.name);

    const [response, request] = [
      host.switchToHttp().getResponse<Response>(),
      host.switchToHttp().getRequest<Request>(),
    ];

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    let message: string;
    let errors: ErrorDetailsSchemaType[] | undefined;

    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const typed = rawResponse as HttpErrorResponse;
      message = typed.message ?? exception.message;

      if (typed.errors) {
        errors = typed.errors.map((issue) => ({
          field: issue.field ?? 'root',
          message: issue.message,
          code: issue.code?.toUpperCase(),
        }));
      }
    } else {
      message = exception.message;
    }

    const errorResponse: BaseErrorResponseSchemaType & {
      errors?: ErrorDetailsSchemaType[];
    } = {
      success: false,
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
