import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  ApiBaseResponseType,
  ErrorDetailType,
} from 'src/utils/zod.schemas';

interface HttpErrorResponse {
  message?: string;
  errors?: ErrorDetailType[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const [response, request] = [
      host.switchToHttp().getResponse<Response>(),
      host.switchToHttp().getRequest<Request>(),
    ];

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    let message: string;
    let errors: ErrorDetailType[] | undefined;

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

    const errorResponse: ApiBaseResponseType & { errors?: ErrorDetailType[] } =
      {
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
