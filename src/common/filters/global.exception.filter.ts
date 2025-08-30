import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createBaseErrorResponse } from 'src/utils/helpers';
import type { BaseErrorResponseSchemaType } from 'src/utils/zod.schemas';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    this.logger.error(message, JSON.stringify(exception));

    const errorResponse: BaseErrorResponseSchemaType = createBaseErrorResponse(
      status,
      message,
      null,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
