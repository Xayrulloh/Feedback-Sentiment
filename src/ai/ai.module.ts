
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiClient } from './ai.client';

@Module({
  providers: [AiService, AiClient],
  exports: [AiService],
})
export class AiModule {}