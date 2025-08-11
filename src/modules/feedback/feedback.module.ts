import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AIService } from '../AI/AI.service';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';


@Module({
  imports: [
    DrizzleModule,
    MulterModule.register({
      storage: multer.memoryStorage()
    }),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, AIService],
})
export class FeedbackModule {}