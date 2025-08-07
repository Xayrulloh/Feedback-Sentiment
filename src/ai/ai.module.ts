// src/ai/ai.module.ts

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiClient } from './ai.client';
import { AiTestController } from './test/ai-test.controller';

@Module({
  providers: [AiService, AiClient],
  controllers: [AiTestController], 
  exports: [AiService],
})
export class AiModule {}