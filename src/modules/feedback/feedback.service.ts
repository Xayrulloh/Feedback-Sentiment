import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AIService } from '../AI/AI.service';
import {
  FeedbackRequestDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FilteredFeedbackType,
  GetFeedbackQuerySchemaDto,
} from './dto/feedback.dto';
import { FeedbackResponseDto } from './dto/feedback.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { FeedbackSchemaType, UserSchemaType } from 'src/utils/zod.schemas';
import * as Papa from 'papaparse';
import { and, eq, inArray, sql } from 'drizzle-orm';

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

  async getFilteredFeedback(
  query: GetFeedbackQuerySchemaDto,
  user: UserSchemaType
): Promise<FilteredFeedbackType> {
  const { sentiment, limit, page } = query;

  const whereConditions = [eq(schema.feedbackSchema.userId, user.id)];

  if (sentiment && sentiment.length > 0) {
    whereConditions.push(inArray(schema.feedbackSchema.sentiment, sentiment));
  }

  const totalResult = await this.db
    .select({
      count: sql<number>`count(*)`
    })
    .from(schema.feedbackSchema)
    .where(and(...whereConditions));

  const total = totalResult[0]?.count ?? 0;

  const feedbacks = await this.db
    .select()
    .from(schema.feedbackSchema)
    .where(and(...whereConditions))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    data: feedbacks,
    pagination: {
      limit,
      page,
      total: Number(total),
      pages: Math.ceil(total / limit)
    }
  };
}

}
