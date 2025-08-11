import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AIService } from '../AI/AI.service';
import {
  FeedbackRequestDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
} from './dto/feedback.dto';
import { FeedbackResponseDto } from './dto/feedback.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { Express } from 'express';
import * as Papa from 'papaparse';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly aiService: AIService,

    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async feedbackManual(
    input: FeedbackRequestDto,
    user: UserSchemaType,
    fileId?: string,
  ): Promise<FeedbackResponseDto[]> {
    const response: FeedbackResponseDto[] = await Promise.all(
      input.feedbacks.map(async (feedback) => {
        const aiResult = await this.aiService.analyzeOne(feedback);

        const [newFeedback] = await this.db
          .insert(schema.feedbackSchema)
          .values({
            content: feedback,
            userId: user.id,
            fileId: fileId, 
            sentiment: aiResult.sentiment,
            confidence: Math.round(aiResult.confidence),
            summary: aiResult.summary,
          })
          .returning();

        return newFeedback;
      }),
    );

    return response;
  }

  async feedbackUpload(
    file: Express.Multer.File,
    user: UserSchemaType,
  ): Promise<FeedbackResponseDto[]> {
    const csvContent = file.buffer.toString('utf8');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', '|', ';'],
    });

    if (parseResult.errors.length > 0) {
      throw new BadRequestException(
        `CSV parsing error: ${parseResult.errors[0].message}`,
      );
    }

    const data = parseResult.data as Record<string, string>[];

    const feedbacks = data.map((row) => {
      return row['feedback'] || row['feedbacks'];
    });

    const validationResult = FeedbackRequestSchema.parse({ feedbacks });
 
    const [newFile] = await this.db
    .insert(schema.fileSchema)
    .values({
      userId: user.id,
      name: file.originalname,
    })
    .returning({ id: schema.fileSchema.id });

    return this.feedbackManual(validationResult, user, newFile.id);
  }
}
