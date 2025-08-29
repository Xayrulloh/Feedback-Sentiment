import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
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
    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    {
      const { method, path } = request;
      this.monitoringService.incrementError({
        method,
        endpoint: path,
        error_message: exception.message,
      });
    }

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    const { message, errors } = this.parseHttpException(
      rawResponse,
      exception.message,
    );

    const errorResponse = this.createBaseErrorResponse(
      status,
      message,
      errors,
      request.url,
    );

    response.status(status).json(errorResponse);
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

  private createBaseErrorResponse(
    statusCode: number,
    message: string,
    errors: ErrorDetailsSchemaType[] | undefined,
    path: string,
  ): BaseErrorResponseSchemaType & { errors?: ErrorDetailsSchemaType[] } {
    return {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
