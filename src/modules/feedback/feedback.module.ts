import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AIService } from '../AI/AI.service';
import { RedisModule } from '../redis/redis.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FileGeneratorService } from './file-generator.service';

@Module({
  imports: [
    DrizzleModule,
    RedisModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, AIService, FileGeneratorService],
})
export class FeedbackModule {}
