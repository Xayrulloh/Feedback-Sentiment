import { createZodDto } from 'nestjs-zod';
import {
  FeedbackSchema,
  FeedbackSentimentEnum,
  PaginationQuerySchema,
  PaginationResponseSchema,
} from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== ENUMS ====================

const SentimentEnum = z.enum([
  FeedbackSentimentEnum.NEGATIVE,
  FeedbackSentimentEnum.NEUTRAL,
  FeedbackSentimentEnum.POSITIVE,
  FeedbackSentimentEnum.UNKNOWN,
]);

// ==================== REQUEST SCHEMAS ====================

const FeedbackManualRequestSchema = z
  .object({
    feedbacks: z
      .array(z.string().min(10, `Feedback must be at least 10 characters long`))
      .max(100, 'Maximum of 100 feedback items allowed')
      .nonempty('At least one feedback is required')
      .describe('Array of feedback entries, each meeting the minimum length'),
  })
  .describe('Manual feedback submission payload');

const FeedbackQuerySchema = z
  .object({
    sentiment: z
      .union([SentimentEnum, z.array(SentimentEnum)])
      .optional()
      .transform((val) =>
        val ? (Array.isArray(val) ? val : [val]) : undefined,
      )
      .describe('Filter feedback by one or more sentiments'),
  })
  .merge(PaginationQuerySchema)
  .describe('Feedback query parameters with sentiment filter and pagination');

const ReportDownloadQuerySchema = z
  .object({
    format: z.enum(['pdf', 'csv']).describe('Download file format'),
    type: z
      .enum(['summary', 'detailed'])
      .describe('Type of report to generate'),
  })
  .describe('Query parameters for downloading feedback reports');

// ==================== RESPONSE SCHEMAS ====================

const FeedbackResponseSchema = FeedbackSchema.array().describe(
  'Array of feedback items',
);

const FeedbackSingleResponseSchema = FeedbackSchema.describe(
  'Single feedback item',
);

const FeedbackSummaryResponseSchema = z
  .array(
    z.object({
      sentiment: SentimentEnum.describe('Sentiment type of the feedback'),
      count: z.coerce
        .number()
        .min(0)
        .describe('Count of feedbacks with this sentiment'),
      percentage: z.coerce
        .number()
        .min(0)
        .max(100)
        .describe('Percentage of feedbacks with this sentiment'),
    }),
  )
  .describe(
    'Summary of feedback sentiment analysis, including counts and percentages for each sentiment type',
  );

const FeedbackFilteredResponseSchema = z
  .object({
    feedbacks: FeedbackSchema.array().describe('Filtered feedback results'),
    pagination: PaginationResponseSchema.describe('Pagination metadata'),
  })
  .describe('Filtered feedback response with pagination');

const FeedbackGroupedResponseSchema = z
  .object({
    summary: z.string().describe('Summary of grouped feedback items'),
    count: z.number().describe('Number of feedback items in this group'),
    items: z
      .array(
        FeedbackSchema.pick({
          id: true,
          content: true,
          sentiment: true,
        }),
      )
      .describe('Array of feedback items in this group'),
  })
  .describe('Grouped feedback response');

const FeedbackGroupedArrayResponseSchema =
  FeedbackGroupedResponseSchema.array().describe('Array of grouped feedbacks');

// ==================== DTO CLASSES ====================

class FeedbackManualRequestDto extends createZodDto(
  FeedbackManualRequestSchema,
) {}

class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}

class FeedbackSingleResponseDto extends createZodDto(
  FeedbackSingleResponseSchema,
) {}

class FeedbackSummaryResponseDto extends createZodDto(
  FeedbackSummaryResponseSchema,
) {}

class FeedbackFilteredResponseDto extends createZodDto(
  FeedbackFilteredResponseSchema,
) {}

class FeedbackGroupedResponseDto extends createZodDto(
  FeedbackGroupedResponseSchema,
) {}

class FeedbackGroupedArrayResponseDto extends createZodDto(
  FeedbackGroupedArrayResponseSchema,
) {}

class FeedbackQueryDto extends createZodDto(FeedbackQuerySchema) {}

class ReportDownloadQueryDto extends createZodDto(ReportDownloadQuerySchema) {}

export {
  SentimentEnum,
  FeedbackManualRequestSchema,
  FeedbackResponseSchema,
  FeedbackSingleResponseSchema,
  FeedbackSummaryResponseSchema,
  FeedbackFilteredResponseSchema,
  FeedbackGroupedResponseSchema,
  FeedbackGroupedArrayResponseSchema,
  FeedbackQuerySchema,
  ReportDownloadQuerySchema,
  FeedbackManualRequestDto,
  FeedbackResponseDto,
  FeedbackSingleResponseDto,
  FeedbackSummaryResponseDto,
  FeedbackFilteredResponseDto,
  FeedbackGroupedResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackQueryDto,
  ReportDownloadQueryDto,
};
