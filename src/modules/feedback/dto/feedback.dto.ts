import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  FeedbackSchema,
  FeedbackSentimentEnum,
  PaginationSchema,
} from 'src/utils/zod.schemas';

// Request schema
const FeedbackManualRequestSchema = z.object({
  feedbacks: z
    .array(z.string().min(10, `Feedback must be at least 10 characters long`))
    .nonempty('At least one feedback is required')
    .describe('Array of feedback entries, each meeting the minimum length'),
});

// Response schemas
const FeedbackResponseSchema = FeedbackSchema.array();

const FeedbackSummaryResponseSchema = z
  .array(
    z.object({
      sentiment: z
        .enum([
          FeedbackSentimentEnum.POSITIVE,
          FeedbackSentimentEnum.NEUTRAL,
          FeedbackSentimentEnum.NEGATIVE,
          FeedbackSentimentEnum.UNKNOWN,
        ])
        .describe('Sentiment type of the feedback'),
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

type FeedbackSummaryResponseSchemaType = z.infer<
  typeof FeedbackSummaryResponseSchema
>;

// DTOs
class FeedbackManualRequestDto extends createZodDto(
  FeedbackManualRequestSchema,
) {}
class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}

const SentimentEnum = z.enum([
  FeedbackSentimentEnum.NEGATIVE,
  FeedbackSentimentEnum.NEUTRAL,
  FeedbackSentimentEnum.POSITIVE,
  FeedbackSentimentEnum.UNKNOWN,
]);

const FeedbackQuerySchema = z.object({
  sentiment: SentimentEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class FeedbackQuerySchemaDto extends createZodDto(FeedbackQuerySchema) {}

const FeedbackFilteredResponseSchema = z.object({
  data: FeedbackSchema.array(),
  pagination: PaginationSchema,
});

type FeedbackFilteredResponseSchemaType = z.infer<
  typeof FeedbackFilteredResponseSchema
>;

const FeedbackGroupedResponseSchema = z.object({
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
});

const FeedbackGroupedArrayResponseSchema =
  FeedbackGroupedResponseSchema.array();

class FeedbackGroupedResponseDto extends createZodDto(
  FeedbackGroupedResponseSchema,
) {}

const ReportDownloadQuerySchema = z.object({
  format: z.enum(['pdf', 'csv']),
  type: z.enum(['summary', 'detailed']),
});

class ReportDownloadQueryDto extends createZodDto(ReportDownloadQuerySchema) {}

class FeedbackGroupedArrayResponseDto extends createZodDto(
  FeedbackGroupedArrayResponseSchema,
) {}

type FeedbackGroupedResponseType = z.infer<
  typeof FeedbackGroupedResponseSchema
>;
type FeedbackGroupedArrayResponseType = z.infer<
  typeof FeedbackGroupedArrayResponseSchema
>;

class FeedbackSummaryResponseDto extends createZodDto(
  FeedbackSummaryResponseSchema,
) {}

export {
  ReportDownloadQuerySchema,
  ReportDownloadQueryDto,
  FeedbackManualRequestSchema,
  FeedbackGroupedResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedResponseSchema,
  FeedbackGroupedArrayResponseSchema,
  FeedbackResponseSchema,
  type FeedbackGroupedResponseType,
  type FeedbackGroupedArrayResponseType,
  FeedbackSummaryResponseSchema,
  FeedbackManualRequestDto,
  FeedbackResponseDto,
  FeedbackSummaryResponseDto,
  type FeedbackFilteredResponseSchemaType,
  FeedbackFilteredResponseSchema,
  FeedbackQuerySchema,
  FeedbackQuerySchemaDto,
  SentimentEnum,
  type FeedbackSummaryResponseSchemaType,
};
