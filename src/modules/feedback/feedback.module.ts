import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AIService } from '../AI/AI.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FileGeneratorService } from './file-generator.service';

@Module({
  imports: [
    DrizzleModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    AIService,
    FileGeneratorService,
    MonitoringService,
  ],
})
export class FeedbackModule {}
