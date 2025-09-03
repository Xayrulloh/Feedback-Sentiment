import * as crypto from 'node:crypto';
import path from 'node:path';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from 'drizzle-orm';
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
import { RedisService } from '../redis/redis.service';
import {
  FeedbackFilteredResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackManualRequestDto,
  FeedbackManualRequestSchema,
  FeedbackQueryDto,
  FeedbackResponseDto,
  FeedbackSingleResponseDto,
  FeedbackSummaryResponseDto,
  ReportDownloadQueryDto,
} from './dto/feedback.dto';
import { FileGeneratorService } from './file-generator.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly aiService: AIService,
    private readonly fileGeneratorService: FileGeneratorService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly redisService: RedisService,
  ) {}

  async feedbackManual(
    input: FeedbackManualRequestDto,
    user: UserSchemaType,
    fileId: string | null = null,
  ): Promise<FeedbackResponseDto> {
    const processedFeedbacks = await Promise.all(
      input.feedbacks.map((f) => {
        const normalized = f.toLowerCase().trim();
        const hash = crypto
          .createHash('sha256')
          .update(normalized)
          .digest('hex');

        return { normalized, hash };
      }),
    );

    const existing = await this.db.query.feedbacksSchema.findMany({
      where: inArray(
        schema.feedbacksSchema.contentHash,
        processedFeedbacks.map((p) => p.hash),
      ),
    });
    const existingMap = new Map(existing.map((f) => [f.contentHash, f]));
    const feedbacks = await Promise.all(
      processedFeedbacks.map(async ({ normalized, hash }) => {
        let feedback = existingMap.get(hash);

        if (!feedback) {
          const aiResult = await this.aiService.analyzeOne(normalized);

          const [inserted] = await this.db
            .insert(schema.feedbacksSchema)
            .values({
              contentHash: hash,
              content: normalized,
              sentiment: aiResult.sentiment,
              confidence: Math.round(aiResult.confidence),
              summary: aiResult.summary,
            })
            .returning();

          feedback = inserted;
        }

        await this.db
          .insert(schema.usersFeedbacksSchema)
          .values({
            userId: user.id,
            fileId,
            feedbackId: feedback.id,
          })
          .onConflictDoNothing();

        return {
          ...feedback,
          userId: user.id,
          fileId,
        } as FeedbackSchemaType;
      }),
    );

    await this.redisService.clearUserCache(user.id);

    return feedbacks;
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

    const validationResult = FeedbackManualRequestSchema.safeParse({
      feedbacks,
    });

    let validFeedbacks: FeedbackManualRequestDto['feedbacks'];

    if (validationResult.success) {
      validFeedbacks = validationResult.data.feedbacks;
    } else {
      throw new BadRequestException({
        message: 'Invalid feedback payload',
        errors: validationResult.error.issues,
      });
    }

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

    return this.feedbackManual({ feedbacks: validFeedbacks }, user, newFile.id);
  }

  async feedbackFiltered(
    query: FeedbackQueryDto,
    user: UserSchemaType,
  ): Promise<FeedbackFilteredResponseDto> {
    const { sentiment, limit, page } = query;
    const whereConditions = [eq(schema.usersFeedbacksSchema.userId, user.id)];

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
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(and(...whereConditions));

    const total = totalResult[0]?.count ?? 0;

    const feedbacks = await this.db
      .select({
        ...getTableColumns(schema.feedbacksSchema),
        userId: schema.usersFeedbacksSchema.userId,
        fileId: schema.usersFeedbacksSchema.fileId,
      })
      .from(schema.feedbacksSchema)
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(and(...whereConditions))
      .orderBy(desc(schema.feedbacksSchema.createdAt))
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
    const cacheKey = `feedback:grouped:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const grouped = await this.db
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
          ) ORDER BY ${schema.feedbacksSchema.createdAt} DESC
        )`,
      })
      .from(schema.feedbacksSchema)
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(eq(schema.usersFeedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.summary)
      .orderBy(desc(count(schema.feedbacksSchema.id)))
      .limit(20);

    await this.redisService.setWithExpiry(
      cacheKey,
      JSON.stringify(grouped),
      120,
    );

    return grouped;
  }

  async feedbackSummary(userId: string): Promise<FeedbackSummaryResponseDto> {
    const cacheKey = `feedback:sentiment-summary:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const summary = await this.db
      .select({
        sentiment: schema.feedbacksSchema.sentiment,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        percentage: sql<number>`
          CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2))
        `,
      })
      .from(schema.feedbacksSchema)
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(eq(schema.usersFeedbacksSchema.userId, userId))
      .groupBy(schema.feedbacksSchema.sentiment);

    await this.redisService.setWithExpiry(
      cacheKey,
      JSON.stringify(summary),
      60,
    );
    return summary;
  }

  async getAllFeedback(user: UserSchemaType): Promise<FeedbackSchemaType[]> {
    return this.db
      .select({
        ...getTableColumns(schema.feedbacksSchema),
        userId: schema.usersFeedbacksSchema.userId,
        fileId: schema.usersFeedbacksSchema.fileId,
      })
      .from(schema.feedbacksSchema)
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(eq(schema.usersFeedbacksSchema.userId, user.id))
      .orderBy(desc(schema.feedbacksSchema.createdAt));
  }

  async feedbackReportDownload(
    query: ReportDownloadQueryDto,
    user: UserSchemaType,
    res: Response,
  ) {
    const { format, type } = query;
    const cacheKey = `feedback:report:${user.id}:${type}:${format}`;

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      const buffer = Buffer.from(cached, 'base64');
      this.sendFileResponse(res, buffer, format, type);
      return;
    }

    const data =
      type === 'detailed'
        ? await this.getAllFeedback(user)
        : await this.feedbackSummary(user.id);

    const fileBuffer = await this.fileGeneratorService.generate(
      format,
      type,
      data,
    );

    await this.redisService.setWithExpiry(
      cacheKey,
      fileBuffer.toString('base64'),
      300,
    );

    this.sendFileResponse(res, fileBuffer, format, type);
  }

  private sendFileResponse(
    res: Response,
    buffer: Buffer,
    format: string,
    type: string,
  ) {
    const fileName = `feedback-report-${type}-${Date.now()}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      format === 'csv' ? 'text/csv' : 'application/pdf',
    );
    res.send(buffer);
  }

  async getFeedbackById(
    id: string,
    userId: string,
  ): Promise<FeedbackSingleResponseDto> {
    const feedback = await this.db
      .select({
        ...getTableColumns(schema.feedbacksSchema),
        userId: schema.usersFeedbacksSchema.userId,
        fileId: schema.usersFeedbacksSchema.fileId,
      })
      .from(schema.feedbacksSchema)
      .innerJoin(
        schema.usersFeedbacksSchema,
        eq(schema.usersFeedbacksSchema.feedbackId, schema.feedbacksSchema.id),
      )
      .where(
        and(
          eq(schema.feedbacksSchema.id, id),
          eq(schema.usersFeedbacksSchema.userId, userId),
        ),
      )
      .limit(1);

    if (!feedback[0]) {
      throw new BadRequestException(`Feedback with id ${id} not found`);
    }

    return feedback[0];
  }
}
