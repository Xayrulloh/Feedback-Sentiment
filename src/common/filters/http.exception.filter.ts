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
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    let message: string;
    let errors: ErrorDetailType[] | null = null;

    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const typed = rawResponse as HttpErrorResponse;
      message = typed.message ?? exception.message;
      errors = typed.errors ?? null;
    } else {
      message = exception.message;
    }

    const errorResponse: ApiBaseResponseType = {
      success: false,
      statusCode: status,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
