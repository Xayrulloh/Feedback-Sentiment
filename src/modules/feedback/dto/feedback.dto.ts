import * as z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { MIN_FEEDBACK_LENGTH } from 'src/utils/constants';

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

const GroupedFeedbackItemSchema = FeedbackSchema.pick({
  id: true,
  content: true,
  sentiment: true,
});

const FeedbackGroupSchema = z.object({
  summary: z.string(),
  count: z.number(),
  items: z.array(GroupedFeedbackItemSchema),
});

const GroupedFeedbackArrayResponseSchema = FeedbackGroupSchema.array();

class GroupedFeedbackItemDto extends createZodDto(GroupedFeedbackItemSchema) {}
class FeedbackGroupDto extends createZodDto(FeedbackGroupSchema) {}
class GroupedFeedbackArrayResponseDto extends createZodDto(GroupedFeedbackArrayResponseSchema) {}

export type GroupedFeedbackItem = z.infer<typeof GroupedFeedbackItemSchema>;
export type FeedbackGroup = z.infer<typeof FeedbackGroupSchema>;
export type GroupedFeedbackArrayResponse = z.infer<typeof GroupedFeedbackArrayResponseSchema>;


export {
  FeedbackRequestDto,
  FeedbackResponseDto,
  FeedbackArrayResponseDto,
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackArrayResponseSchema,
  GroupedFeedbackItemDto,
  FeedbackGroupDto,
  GroupedFeedbackArrayResponseDto,
  GroupedFeedbackItemSchema,
  FeedbackGroupSchema,
  GroupedFeedbackArrayResponseSchema,
};
