import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema, FeedbackSentimentEnum,  PaginationSchema } from 'src/utils/zod.schemas';
import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';


// Request schema
const FeedbackRequestSchema = z.object({ // TODO: name should be FeedbackManualRequestSchema
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
const FeedbackResponseSchema = FeedbackSchema; // FIXME: we don't need this schema since the response is always array
const FeedbackArrayResponseSchema = FeedbackResponseSchema.array(); // FIXME: since we only have one, we can call it FeedbackResponseSchema

const FeedbackGetSummaryResponseSchema = z // FIXME: since it's Response we don't need Get part of the name
  .object({ // FIXME: I want you to just return the data (sentiment, count, percentage) not data and updatedAt (for now let's keep it simple)
    data: z.array(
      z.object({
        sentiment: z.enum([ // TODO: always include describe part
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

  type FeedbackGetSummaryResponseSchemaType = z.infer<typeof FeedbackGetSummaryResponseSchema>;

// SSE
const FeedbackSummaryEventSchema = z // FIXME: let's remove this part and not focus
  .object({
    type: z.string().describe('Event type identifier'),
  })
  .merge(FeedbackGetSummaryResponseSchema)
  .describe('Server-sent event for feedback summary updates');

// DTOs
class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {} // FIXME: change the name
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

const GetFeedbackQuerySchema = z.object({ // FIXME: make it simple (look for internet and find best practice (to work zod with query))
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


const FilteredFeedbackSchema = z.object({ // FIXME: naming issue
  data: FeedbackSchema.array(),
  pagination: PaginationSchema,
})

type FilteredFeedbackSchemaType = z.infer<typeof FilteredFeedbackSchema>;



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

const ReportDownloadRequestSchema = z.object({ // FIXME: naming issue
  format: z.enum(['pdf', 'csv']),
  type: z.enum(['summary', 'detailed']),
});

class ReportDownloadRequestDto extends createZodDto(ReportDownloadRequestSchema){}

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
  ReportDownloadRequestSchema,
  ReportDownloadRequestDto,
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
  SentimentEnum,
  type FeedbackGetSummaryResponseSchemaType,
};
