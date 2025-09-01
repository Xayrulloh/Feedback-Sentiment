import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createBaseErrorResponse } from 'src/helpers/create-base-error-response.helper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const [request, response] = [
      host.switchToHttp().getRequest<Request>(),
      host.switchToHttp().getResponse<Response>(),
    ];

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Internal server error';

    Logger.error(message, JSON.stringify(exception));

    response
      .status(status)
      .json(createBaseErrorResponse(status, message, null, request.url));
  }
}
