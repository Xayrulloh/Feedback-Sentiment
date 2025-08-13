import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema, FeedbackSentimentEnum,  PaginationSchema } from 'src/utils/zod.schemas';

import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';
import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';

// Request schema
const FeedbackRequestSchema = z.object({
  feedbacks: z
    .array(
      z
        .string()
        .min(
          MIN_FEEDBACK_LENGTH,
          `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long`,
        ),
    )
    .nonempty('At least one feedback is required')
    .describe('Array of feedback entries, each meeting the minimum length'),
});

// Response schemas
const FeedbackResponseSchema = FeedbackSchema;
const FeedbackArrayResponseSchema = FeedbackResponseSchema.array();

const FeedbackGetSummaryResponseSchema = z
  .object({
    data: z.array(
      z.object({
        sentiment: z.enum([
          FeedbackSentimentEnum.POSITIVE,
          FeedbackSentimentEnum.NEUTRAL,
          FeedbackSentimentEnum.NEGATIVE,
          FeedbackSentimentEnum.UNKNOWN,
        ]),
        count: z.coerce.number().min(0),
        percentage: z.coerce.number().min(0).max(100),
      }),
    ),
    updatedAt: z.string().datetime(),
  })
  .describe(
    'Summary of feedback sentiment analysis, including counts and percentages for each sentiment type',
  );

// SSE
const FeedbackSummaryEventSchema = z
  .object({
    type: z.string().describe('Event type identifier'),
  })
  .merge(FeedbackGetSummaryResponseSchema)
  .describe('Server-sent event for feedback summary updates');

// DTOs
class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {}
class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}
class FeedbackArrayResponseDto extends createZodDto(
  FeedbackArrayResponseSchema,
) {}

const SentimentEnum = z.enum([
  FeedbackSentimentEnum.NEGATIVE,
  FeedbackSentimentEnum.NEUTRAL,
  FeedbackSentimentEnum.POSITIVE,
  FeedbackSentimentEnum.UNKNOWN,
]);

function isValidSentiment(val: string): val is FeedbackSentimentEnum {
  return SentimentEnum.options.includes(val as FeedbackSentimentEnum);
}

const GetFeedbackQuerySchema = z.object({
    sentiment: z
    .union([
      SentimentEnum.array(),
      z.string()
    ])
    .optional()
    .transform((val) => {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  return val.split(',').map(s => s.trim());
})
.refine(
  (arr) =>
    arr === undefined || arr.every(isValidSentiment),
  { message: 'Invalid sentiment value(s) provided' }
),

  limit: z.coerce.number().int().max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
})

class GetFeedbackQuerySchemaDto extends createZodDto(GetFeedbackQuerySchema) {}


const FilteredFeedbackSchema = z.object({
  data: FeedbackSchema.array(),
  pagination: PaginationSchema,
})

type FilteredFeedbackSchemaType = z.infer<typeof FilteredFeedbackSchema>;



const FeedbackGroupedItemSchema = FeedbackSchema.pick({
  id: true,
  content: true,
  sentiment: true,
});

const FeedbackGroupedResponseSchema = z.object({
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
  FeedbackGetSummaryResponseSchema,
) {}
class FeedbackSummaryEventDto extends createZodDto(
  FeedbackSummaryEventSchema,
) {}

export {
  FeedbackRequestSchema,
  FeedbackResponseSchema,
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
  FeedbackGetSummaryResponseSchema,
  FeedbackSummaryEventSchema,
  FeedbackRequestDto,
  FeedbackResponseDto,
  FeedbackArrayResponseDto,
  FeedbackGetSummaryResponseDto,
  FeedbackSummaryEventDto,
  type FilteredFeedbackSchemaType,
  FilteredFeedbackSchema,
  GetFeedbackQuerySchema,
  GetFeedbackQuerySchemaDto,

};
