import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { DatabaseExceptionFilter } from './common/filters/db.exception.filter';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
import { ZodExceptionFilter } from './common/filters/zod.exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success.response.interceptor';
import { ZodSerializerInterceptorCustom } from './common/interceptors/zod.response.interceptor';
import { EnvModule } from './config/env/env.module';
import { AiModule } from './modules/AI/AI.module';
import { AuthModule } from './modules/auth/auth.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

@Module({
  imports: [EnvModule, AuthModule, AiModule, FeedbackModule],

  controllers: [],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: SuccessResponseInterceptor },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: DatabaseExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptorCustom },
  ],
})
export class AppModule {}
