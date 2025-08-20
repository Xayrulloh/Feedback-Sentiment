import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    Logger.error(exception, ZodExceptionFilter.name);

    const [response, request] = [
      host.switchToHttp().getResponse<Response>(),
      host.switchToHttp().getRequest<Request>(),
    ];

    const issues = exception.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'root',
      message: issue.message,
      code: issue.code.toUpperCase(),
    }));

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      ...(issues.length > 0 ? { errors: issues } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
