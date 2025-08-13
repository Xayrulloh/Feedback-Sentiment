import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema, PaginationSchema } from 'src/utils/zod.schemas';
import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';
import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';

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

class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {}

const FeedbackResponseSchema = FeedbackSchema;

const FeedbackArrayResponseSchema = FeedbackResponseSchema.array();

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


export {
  type FilteredFeedbackSchemaType,
  FilteredFeedbackSchema,
  GetFeedbackQuerySchema,
  GetFeedbackQuerySchemaDto,
  FeedbackRequestDto,
  FeedbackResponseDto,
  FeedbackArrayResponseDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackArrayResponseSchema,

};
