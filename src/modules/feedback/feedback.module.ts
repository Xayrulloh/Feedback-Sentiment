import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AIService } from '../AI/AI.service';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { FileGeneratorService } from './file-generator.service';

@Module({
  imports: [
    DrizzleModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, AIService, FileGeneratorService],
})
export class FeedbackModule {}
