import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodSerializerInterceptorCustom } from './common/interceptors/zod.response.interceptor';
import { EnvModule } from './config/env/env.module';
import { AiModule } from './modules/AI/AI.module';
import { AuthModule } from './modules/auth/auth.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

@Module({
  imports: [EnvModule, AuthModule, AiModule, FeedbackModule],

  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptorCustom },
  ],
})
export class AppModule {}
