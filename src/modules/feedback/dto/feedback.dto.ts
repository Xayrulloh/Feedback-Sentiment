import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema, FeedbackSentimentEnum } from 'src/utils/zod.schemas';
import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';

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
const SentimentSummarySchema = z.object({
  data: z.array(
    z.object({
      sentiment: z.enum([
        FeedbackSentimentEnum.POSITIVE,
        FeedbackSentimentEnum.NEUTRAL,
        FeedbackSentimentEnum.NEGATIVE,
        FeedbackSentimentEnum.UNKNOWN,
      ]),
      count: z.coerce.number(),
      percentage: z.coerce.number().max(100),
    }),
  ),
  updatedAt: z.string().datetime(),
});

// DTOs
class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {}
class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}
class FeedbackArrayResponseDto extends createZodDto(
  FeedbackArrayResponseSchema,
) {}
class SentimentSummaryResponseDto extends createZodDto(
  SentimentSummarySchema,
) {}

// Types
type FeedbackRequestDtoType = z.infer<typeof FeedbackRequestSchema>;
type FeedbackResponseDtoType = z.infer<typeof FeedbackResponseSchema>;
type FeedbackArrayResponseDtoType = z.infer<typeof FeedbackArrayResponseSchema>;
type SentimentSummaryDtoType = z.infer<typeof SentimentSummarySchema>;

export {
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackArrayResponseSchema,
  SentimentSummarySchema,
  FeedbackRequestDto,
  FeedbackResponseDto,
  FeedbackArrayResponseDto,
  SentimentSummaryResponseDto,
  type FeedbackRequestDtoType,
  type FeedbackResponseDtoType,
  type FeedbackArrayResponseDtoType,
  type SentimentSummaryDtoType,
};
