import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createBaseErrorResponse } from 'src/helpers/create-base-error-response.helper';
import { normalizeEndpoint } from 'src/helpers/normalize-endpoint.helper';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';
import type { ErrorDetailsSchemaType } from 'src/utils/zod.schemas';
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

    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    this.monitoringService.incrementError({
      method: request.method,
      endpoint: normalizeEndpoint(request.path),
      error_message: exception.message,
    });

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    const { message, errors } = this.parseHttpException(
      rawResponse,
      exception.message,
    );

    response
      .status(status)
      .json(createBaseErrorResponse(status, message, errors, request.url));
  }

  private parseHttpException(
    rawResponse: unknown,
    defaultMessage: string,
  ): { message: string; errors?: ErrorDetailsSchemaType[] } {
    if (!rawResponse || typeof rawResponse !== 'object') {
      return { message: String(rawResponse ?? defaultMessage) };
    }

    const typed = rawResponse as HttpErrorResponse;

    return {
      message: typed.message ?? defaultMessage,
      errors: typed.errors?.map((issue: ZodIssue) => ({
        field: issue.path?.length ? issue.path.join('.') : 'root',
        message: issue.message,
        code: issue.code?.toUpperCase(),
      })),
    };
  }
}
