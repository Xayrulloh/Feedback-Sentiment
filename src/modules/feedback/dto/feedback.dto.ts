import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';

const FeedbackRequestSchema = z.object({
  feedbacks: z
    .array(
      z.string()
        .min(MIN_FEEDBACK_LENGTH, `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long`)
    )
    .nonempty("At least one feedback is required")
    .describe('Array of feedback entries, each meeting the minimum length'),
});

class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {}

const FeedbackResponseSchema = FeedbackSchema.pick({
  id: true,
  content: true,
  sentiment: true,
  confidence: true,
  createdAt: true,
});

const FeedbackArrayResponseSchema = z.array(FeedbackResponseSchema);

class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}
class FeedbackArrayResponseDto extends createZodDto(FeedbackArrayResponseSchema) {}

export {
  FeedbackRequestDto,
  FeedbackResponseDto,
  FeedbackArrayResponseDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackArrayResponseSchema,
};
