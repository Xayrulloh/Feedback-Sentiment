import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { EnvModule } from './config/env/env.module';
import { AiModule } from './ai/ai.module'; 


@Module({
  imports: [EnvModule, AiModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
