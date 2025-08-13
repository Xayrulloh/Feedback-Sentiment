import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AIService } from '../AI/AI.service';
import {
  FeedbackGroupedArrayResponseType,
  FeedbackGroupedItemType,
  FeedbackRequestDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackGetSummaryResponseDto,
  FeedbackGetSummaryResponseSchema,
  FeedbackResponseDto,
} from './dto/feedback.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { FeedbackSchemaType, FeedbackSentimentEnum, UserSchemaType } from 'src/utils/zod.schemas';
import type { Express } from 'express';
import * as Papa from 'papaparse';
import { count, eq, isNotNull, ne, sql, and } from 'drizzle-orm';

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
          .insert(schema.feedbacksSchema)
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
      .insert(schema.filesSchema)
      .values({
        userId: user.id,
        name: file.originalname,
      })
      .returning({ id: schema.filesSchema.id });

    return this.feedbackManual(validationResult, user, newFile.id);
  }


  async feedbackGrouped(userId: string): Promise<FeedbackGroupedArrayResponseType> {
    const result = await this.db
      .select({
        summary: schema.feedbackSchema.summary,
        count: count(schema.feedbackSchema.id),
        items: sql<FeedbackGroupedItemType[]>`JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ${schema.feedbackSchema.id}::text,
            'content', ${schema.feedbackSchema.content},
            'sentiment', ${schema.feedbackSchema.sentiment}
          )
        )`.as('items')
      })
      .from(schema.feedbackSchema)
      .where(
        and(
          eq(schema.feedbackSchema.userId, userId)
        )
      )
      .groupBy(schema.feedbackSchema.summary)
      .having(sql`COUNT(*) > 1`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20);
  
    return result.map(row => ({
      summary: row.summary,
      count: Number(row.count),
      items: row.items.map(item => ({
        id: item.id,
        content: item.content,
        sentiment: item.sentiment as FeedbackSentimentEnum
      }))
    }));

  async feedbackSummary(
    userId: string,
  ): Promise<FeedbackGetSummaryResponseDto> {
    const results = await this.db
      .select({
        sentiment: schema.feedbacksSchema.sentiment,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        percentage: sql<number>`CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2))`,
      })
      .from(schema.feedbacksSchema)
      .where(eq(schema.feedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.sentiment);

    const summaryData: FeedbackGetSummaryResponseDto = {
      data: results,
      updatedAt: new Date().toISOString(),
    };

    return FeedbackGetSummaryResponseSchema.parse(summaryData);
  }
}
