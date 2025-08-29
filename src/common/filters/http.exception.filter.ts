import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';
import type {
  BaseErrorResponseSchemaType,
  ErrorDetailsSchemaType,
} from 'src/utils/zod.schemas';
import type { ZodIssue } from 'zod';

interface HttpErrorResponse {
  message?: string;
  errors?: ErrorDetailsSchemaType[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly monitoringService: MonitoringService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    Logger.error(exception.message, HttpExceptionFilter.name);

    // TODO: take request first then response
    const [response, request] = [
      host.switchToHttp().getResponse<Response>(),
      host.switchToHttp().getRequest<Request>(),
    ];

    // wrap it in block scope
    this.monitoringService.incrementError(
      request.method,
      request.path,
      exception.message,
    );

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    // TODO: the logic below is too complex make it simple
    let message: string;
    let errors: ErrorDetailsSchemaType[] | undefined;

    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const typed = rawResponse as HttpErrorResponse;

      message = typed.message ?? exception.message;

      if (typed.errors) {
        errors = typed.errors.map((issue: ZodIssue) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : 'root',
          message: issue.message,
          code: issue.code.toUpperCase(),
        }));
      }
    } else {
      message = exception.message;
    }

    // TODO: take base error response by the function inside helper
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
