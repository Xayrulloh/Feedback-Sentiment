import path from 'node:path';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Response } from 'express';
import * as Papa from 'papaparse';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  FeedbackSchemaType,
  FeedbackSentimentEnum,
  UserSchemaType,
} from 'src/utils/zod.schemas';
import { AIService } from '../AI/AI.service';
import {
  FeedbackFilteredResponseDto,
  FeedbackGroupedArrayResponseDto,
  type FeedbackManualRequestDto,
  FeedbackManualRequestSchema,
  FeedbackQueryDto,
  type FeedbackResponseDto,
  type FeedbackSingleResponseDto,
  type FeedbackSummaryResponseDto,
  type ReportDownloadQueryDto,
} from './dto/feedback.dto';
import { FileGeneratorService } from './file-generator.service';

// Give proper Scopes to inject
@Injectable()
export class FeedbackService {
  constructor(
    private readonly aiService: AIService,
    private readonly fileGeneratorService: FileGeneratorService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async feedbackManual(
    input: FeedbackManualRequestDto,
    user: UserSchemaType,
    fileId: string | null = null,
  ): Promise<FeedbackResponseDto> {
    const results = await Promise.allSettled(
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

    const isFulfilled = <T>(
      r: PromiseSettledResult<T>,
    ): r is PromiseFulfilledResult<T> => r.status === 'fulfilled';

    const response: FeedbackResponseDto = results
      .filter(isFulfilled)
      .map((r) => r.value);

    return response;
  }

  async feedbackUpload(
    file: Express.Multer.File,
    user: UserSchemaType,
  ): Promise<FeedbackResponseDto> {
    const csvContent = file.buffer.toString('utf8');

    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
    });

    const criticalErrors = parseResult.errors.filter(
      (error) =>
        !error.message.includes('Unable to auto-detect delimiting character'),
    );

    if (criticalErrors.length > 0) {
      throw new BadRequestException(
        `CSV parsing error: ${criticalErrors[0].message}`,
      );
    }

    if (parseResult.data.length === 0) {
      throw new BadRequestException(
        'The uploaded file must contain at least one row of data.',
      );
    }

    const firstRow = parseResult.data[0];
    const hasFeedbackColumn = 'feedback' in firstRow || 'feedbacks' in firstRow;

    if (!hasFeedbackColumn) {
      const availableColumns = Object.keys(firstRow);

      throw new BadRequestException(
        `Missing required column. Expected "feedback" or "feedbacks", found: ${availableColumns.join(', ')}`,
      );
    }

    const feedbacks = parseResult.data
      .map((row) => row.feedback || row.feedbacks)
      .filter((feedback): feedback is string => Boolean(feedback?.trim()));

    if (feedbacks.length === 0) {
      throw new BadRequestException(
        'No valid feedback found. All feedback values are empty.',
      );
    }

    // FIXME: user safeParse and check the result and throw meaningful error
    const validationResult = FeedbackManualRequestSchema.parse({ feedbacks });
    const extension = path.extname(file.originalname).replace('.', '') || 'csv';
    const [newFile] = await this.db
      .insert(schema.filesSchema)
      .values({
        userId: user.id,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        rowCount: feedbacks.length,
        extension,
      })
      .returning({ id: schema.filesSchema.id });

    return this.feedbackManual(validationResult, user, newFile.id);
  }

  async feedbackFiltered(
    query: FeedbackQueryDto,
    user: UserSchemaType,
  ): Promise<FeedbackFilteredResponseDto> {
    const { sentiment, limit, page } = query;

    const whereConditions = [eq(schema.feedbacksSchema.userId, user.id)];

    if (sentiment && sentiment.length > 0) {
      whereConditions.push(
        inArray(schema.feedbacksSchema.sentiment, sentiment),
      );
    }

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.feedbacksSchema)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count ?? 0;

    // TODO: Use query
    const feedbacks = await this.db
      .select()
      .from(schema.feedbacksSchema)
      .where(and(...whereConditions))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      feedbacks,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async feedbackGrouped(
    userId: string,
  ): Promise<FeedbackGroupedArrayResponseDto> {
    return await this.db
      .select({
        summary: schema.feedbacksSchema.summary,
        count: count(schema.feedbacksSchema.id),
        items: sql<
          Array<{
            id: string;
            content: string;
            sentiment: FeedbackSentimentEnum;
          }>
        >`JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ${schema.feedbacksSchema.id}::text,
            'content', ${schema.feedbacksSchema.content},
            'sentiment', ${schema.feedbacksSchema.sentiment}
          )
        )`,
      })
      .from(schema.feedbacksSchema)
      .where(eq(schema.feedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.summary)
      .orderBy(desc(count(schema.feedbacksSchema.id)))
      .limit(20);
  }

  async feedbackSummary(userId: string): Promise<FeedbackSummaryResponseDto> {
    return this.db
      .select({
        sentiment: schema.feedbacksSchema.sentiment,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        percentage: sql<number>`CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2))`,
      })
      .from(schema.feedbacksSchema)
      .where(eq(schema.feedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.sentiment);
  }

  async getAllFeedback(user: UserSchemaType): Promise<FeedbackResponseDto> {
    // FIXME: Use query
    return this.db
      .select()
      .from(schema.feedbacksSchema)
      .where(eq(schema.feedbacksSchema.userId, user.id));
  }

  async feedbackReportDownload(
    query: ReportDownloadQueryDto,
    user: UserSchemaType,
    res: Response,
  ) {
    const { format, type } = query;

    let data: FeedbackSchemaType[] | FeedbackSummaryResponseDto;

    if (type === 'detailed') {
      data = await this.getAllFeedback(user);
    } else {
      data = await this.feedbackSummary(user.id);
    }

    const fileBuffer = await this.fileGeneratorService.generate(
      format,
      type,
      data,
    );

    const fileName = `feedback-report-${type}-${Date.now()}.${format}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      format === 'csv' ? 'text/csv' : 'application/pdf',
    );

    res.send(fileBuffer);
  }

  async getFeedbackById(id: string): Promise<FeedbackSingleResponseDto> {
    const feedback = await this.db.query.feedbacksSchema.findFirst({
      where: eq(schema.feedbacksSchema.id, id),
    });

    if (!feedback) {
      throw new BadRequestException(`Feedback with id ${id} not found`);
    }

    return feedback;
  }
}
