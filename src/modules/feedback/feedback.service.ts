import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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
// biome-ignore lint/style/useImportType: Needed for DI
import { AIService } from '../AI/AI.service';
import {
  type FeedbackFilteredResponseSchemaType,
  type FeedbackGroupedArrayResponseType,
  type FeedbackManualRequestDto,
  FeedbackManualRequestSchema,
  type FeedbackQuerySchemaDto,
  type FeedbackResponseDto,
  type FeedbackSummaryResponseDto,
  FeedbackSummaryResponseSchema,
  type ReportDownloadQueryDto,
} from './dto/feedback.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { FileGeneratorService } from './file-generator.service';
import path from 'path';

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
    const response: FeedbackResponseDto = await Promise.all(
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
  ): Promise<FeedbackResponseDto> {
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
      return row.feedback || row.feedbacks;
    });

    const validationResult = FeedbackManualRequestSchema.parse({ feedbacks });
    const extension = path.extname(file.originalname).replace(".", "") || "csv";
    const [newFile] = await this.db
      .insert(schema.filesSchema)
      .values({
        userId: user.id,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        rowCount: data.length,
        extension,
      })
      .returning({ id: schema.filesSchema.id });

    return this.feedbackManual(validationResult, user, newFile.id);
  }

  async feedbackFiltered(
    query: FeedbackQuerySchemaDto,
    user: UserSchemaType,
  ): Promise<FeedbackFilteredResponseSchemaType> {
    const { sentiment, limit, page } = query;

    const whereConditions = [eq(schema.feedbacksSchema.userId, user.id)];

    if (sentiment && sentiment.length > 0) {
      whereConditions.push(eq(schema.feedbacksSchema.sentiment, sentiment));
    }

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.feedbacksSchema)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count ?? 0;

    const feedbacks = await this.db
      .select()
      .from(schema.feedbacksSchema)
      .where(and(...whereConditions))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data: feedbacks,
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
  ): Promise<FeedbackGroupedArrayResponseType> {
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
      .having(sql`COUNT(*) > 1`)
      .orderBy(desc(count(schema.feedbacksSchema.id)))
      .limit(20);
  }

  async feedbackSummary(userId: string): Promise<FeedbackSummaryResponseDto> {
    const results = await this.db
      .select({
        sentiment: schema.feedbacksSchema.sentiment,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        percentage: sql<number>`CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2))`,
      })
      .from(schema.feedbacksSchema)
      .where(eq(schema.feedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.sentiment);

    return FeedbackSummaryResponseSchema.parse(results);
  }

  async getAllFeedback(user: UserSchemaType): Promise<FeedbackSchemaType[]> {
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
}
