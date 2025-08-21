import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
import { ZodExceptionFilter } from './common/filters/zod.exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ZodSerializerInterceptorCustom } from './common/interceptors/zod.response-checker.interceptor';
import { EnvModule } from './config/env/env.module';
import { AiModule } from './modules/AI/AI.module';
import { AuthModule } from './modules/auth/auth.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { FileModule } from './modules/file/file.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [EnvModule, AuthModule, AiModule, FeedbackModule, FileModule, PrometheusModule.register(),],

  controllers: [],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptorCustom },
  ],
})
export class AppModule {}
