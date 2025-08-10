import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AIService } from '../AI/AI.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Module({
  imports: [
    DrizzleModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, AIService],
  exports: [FeedbackService], 
})
export class FeedbackModule {}