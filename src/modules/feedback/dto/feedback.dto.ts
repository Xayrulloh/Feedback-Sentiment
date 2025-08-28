// TODO: group the schema/type/dto/class/etc... (IN ALL .dto.ts FILES)
import { createZodDto } from 'nestjs-zod';
import {
  FeedbackSchema,
  FeedbackSentimentEnum,
  PaginationSchema,
} from 'src/utils/zod.schemas';
import * as z from 'zod';

// Request schemas
const FeedbackManualRequestSchema = z.object({
  feedbacks: z
    .array(z.string().min(10, `Feedback must be at least 10 characters long`))
    .max(100, 'Maximum of 100 feedback items allowed')
    .nonempty('At least one feedback is required')
    .describe('Array of feedback entries, each meeting the minimum length'),
});

// feedback request params
// FIXME: we don't need this
const FeedbackSingleParamSchema = z.object({
  id: z.string().uuid(),
});

type FeedbackSingleParamSchemaType = z.infer<typeof FeedbackSingleParamSchema>;

// Response schemas
// TODO: describe
const FeedbackResponseSchema = FeedbackSchema.array();

// TODO: describe
const FeedbackSingleResponseSchema = FeedbackSchema;

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

type FeedbackSingleResponseSchemaType = z.infer<
  typeof FeedbackSingleResponseSchema
>;

// DTOs

class FeedbackSingleResponseDto extends createZodDto(
  FeedbackSingleResponseSchema,
) {}

class FeedbackSingleParamsRequestDto extends createZodDto(
  FeedbackSingleParamSchema,
) {}
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

// TODO: describe
const FeedbackQuerySchema = z.object({
  sentiment: z
    .union([SentimentEnum, z.array(SentimentEnum)])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  // FIXME: create base PaginationQuerySchema with limit and page and merge it to where u use it
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class FeedbackQuerySchemaDto extends createZodDto(FeedbackQuerySchema) {}

// TODO: describe
const FeedbackFilteredResponseSchema = z.object({
  feedbacks: FeedbackSchema.array(),
  pagination: PaginationSchema,
});

type FeedbackFilteredResponseSchemaType = z.infer<
  typeof FeedbackFilteredResponseSchema
>;

// TODO: describe
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

// TODO: describe
const FeedbackGroupedArrayResponseSchema =
  FeedbackGroupedResponseSchema.array();

class FeedbackGroupedResponseDto extends createZodDto(
  FeedbackGroupedResponseSchema,
) {}

// TODO: describe
const ReportDownloadQuerySchema = z.object({
  format: z.enum(['pdf', 'csv']),
  type: z.enum(['summary', 'detailed']),
});

class ReportDownloadQueryDto extends createZodDto(ReportDownloadQuerySchema) {}

class FeedbackGroupedArrayResponseDto extends createZodDto(
  FeedbackGroupedArrayResponseSchema,
) {}

// FIXME: REMOVE ALL TYPE THINGS FROM ALL .dto.ts FILES AND USE DTO INSTEAD (not FeedbackGroupedResponseType but FeedbackGroupedResponseDto)
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
  FeedbackSingleResponseSchema,
  FeedbackSingleParamSchema,
  type FeedbackSingleParamSchemaType,
  FeedbackSingleParamsRequestDto,
  FeedbackSingleResponseDto,
  type FeedbackSingleResponseSchemaType,
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
