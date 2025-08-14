import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema, FeedbackSentimentEnum,  PaginationSchema } from 'src/utils/zod.schemas';


// Request schema
const FeedbackManualRequestSchema = z.object({ 
  feedbacks: z
    .array(
      z
        .string()
        .min(
          10,
          `Feedback must be at least 10 characters long`,
        ),
    )
    .nonempty('At least one feedback is required')
    .describe('Array of feedback entries, each meeting the minimum length'),
});

const FeedbackArrayResponseSchema = FeedbackSchema.array();

class FeedbackArrayResponseDto extends createZodDto(FeedbackArrayResponseSchema) {}

const FeedbackSummaryResponseSchema = z 
  .object({ // FIXME: I want you to just return the data (sentiment, count, percentage) not data and updatedAt (for now let's keep it simple)
    data: z.array(
      z.object({
        sentiment: z.enum([ 
          FeedbackSentimentEnum.POSITIVE,
          FeedbackSentimentEnum.NEUTRAL,
          FeedbackSentimentEnum.NEGATIVE,
          FeedbackSentimentEnum.UNKNOWN,
        ]).describe('Sentiment type of the feedback'),
        count: z.coerce.number().min(0).describe('Count of feedbacks with this sentiment'),
        percentage: z.coerce.number().min(0).max(100).describe(
          'Percentage of feedbacks with this sentiment',
        ),
      }),
    ),
    updatedAt: z.string().datetime(),
  })
  .describe(
    'Summary of feedback sentiment analysis, including counts and percentages for each sentiment type',
  );

  type FeedbackSummaryResponseSchemaType = z.infer<typeof FeedbackSummaryResponseSchema>;

// SSE
const FeedbackSummaryEventSchema = z // FIXME: let's remove this part and not focus
  .object({
    type: z.string().describe('Event type identifier'),
  })
  .merge(FeedbackSummaryResponseSchema)
  .describe('Server-sent event for feedback summary updates');

// DTOs
class FeedbackManualRequestDto extends createZodDto(FeedbackManualRequestSchema) {}

const SentimentEnum = z.enum([
  FeedbackSentimentEnum.NEGATIVE,
  FeedbackSentimentEnum.NEUTRAL,
  FeedbackSentimentEnum.POSITIVE,
  FeedbackSentimentEnum.UNKNOWN,
]);

const GetFeedbackQuerySchema = z.object({
 sentiment: SentimentEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class GetFeedbackQuerySchemaDto extends createZodDto(GetFeedbackQuerySchema) {}


const FilteredFeedbackResponseSchema = z.object({
  data: FeedbackSchema.array(),
  pagination: PaginationSchema,
});

type FilteredFeedbackResponseSchemaType = z.infer<typeof FilteredFeedbackResponseSchema>;



const FeedbackGroupedItemSchema = FeedbackSchema.pick({ // FIXME: what's this? (Request/Response?)
  id: true,
  content: true,
  sentiment: true,
});

const FeedbackGroupedResponseSchema = z.object({ // FIXME: just create it with array and use it, no need to separate it to singular and plural one
  summary: z.string().describe('Summary of grouped feedback items'),
  count: z.number().describe('Number of feedback items in this group'),
  items: FeedbackGroupedItemSchema.array().describe(
    'Array of feedback items in this group',
  ),
});

const FeedbackGroupedArrayResponseSchema =
  FeedbackGroupedResponseSchema.array();

class FeedbackGroupedItemDto extends createZodDto(FeedbackGroupedItemSchema) {}
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

type FeedbackGroupedItemType = z.infer<typeof FeedbackGroupedItemSchema>;
type FeedbackGroupedResponseType = z.infer<
  typeof FeedbackGroupedResponseSchema
>;
type FeedbackGroupedArrayResponseType = z.infer<
  typeof FeedbackGroupedArrayResponseSchema
>;

class FeedbackGetSummaryResponseDto extends createZodDto(
  FeedbackSummaryResponseSchema,
) {}
class FeedbackSummaryEventDto extends createZodDto(
  FeedbackSummaryEventSchema,
) {}

export {
  ReportDownloadQuerySchema,
  ReportDownloadQueryDto,
  FeedbackManualRequestSchema,
  FeedbackArrayResponseSchema,
  FeedbackGroupedItemDto,
  FeedbackGroupedResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedItemSchema,
  FeedbackGroupedResponseSchema,
  FeedbackGroupedArrayResponseSchema,
  type FeedbackGroupedItemType,
  type FeedbackGroupedResponseType,
  type FeedbackGroupedArrayResponseType,
  FeedbackSummaryResponseSchema,
  FeedbackSummaryEventSchema,
  FeedbackManualRequestDto,
  FeedbackArrayResponseDto,
  FeedbackGetSummaryResponseDto,
  FeedbackSummaryEventDto,
  type FilteredFeedbackResponseSchemaType,
  FilteredFeedbackResponseSchema,
  GetFeedbackQuerySchema,
  GetFeedbackQuerySchemaDto,
  SentimentEnum,
  type FeedbackSummaryResponseSchemaType,
};
