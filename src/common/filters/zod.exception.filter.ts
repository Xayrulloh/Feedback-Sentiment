import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    Logger.error('Zod validation failed', {
      message: exception.message,
      issues: exception.issues,
      stack: exception.stack,
    });

    const [request, response] = [
      host.switchToHttp().getRequest(),
      host.switchToHttp().getResponse(),
    ];

    const issues = exception.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'root',
      message: issue.message,
      code: issue.code.toUpperCase(),
    }));

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errors: issues,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
