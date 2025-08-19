import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      data: null,
      errors: exception.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'root',
        message: issue.message,
        code: issue.code.toUpperCase(),
      })),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
