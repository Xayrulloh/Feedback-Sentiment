import { FeedbackManualRequestSchema } from 'src/modules/feedback/dto/feedback.dto';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

// TODO: describe
const AIRequestSchema = FeedbackManualRequestSchema;

// TODO: describe
const MistralResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
});

// TODO: describe
const AIResponseSchema = FeedbackSchema.pick({
  sentiment: true,
  confidence: true,
  summary: true,
  content: true,
});

// TODO: describe
const PromptResponseSchema = AIResponseSchema.omit({ content: true });

type AIRequestSchemaDto = z.infer<typeof AIRequestSchema>;
type MistralResponse = z.infer<typeof MistralResponseSchema>;
type AIResponseSchemaType = z.infer<typeof AIResponseSchema>;
type PromptResponseSchemaType = z.infer<typeof PromptResponseSchema>;

// TODO: let's have only one export
export {
  AIRequestSchema,
  AIResponseSchema,
  MistralResponseSchema,
  PromptResponseSchema,
};

export type {
  AIRequestSchemaDto,
  MistralResponse,
  AIResponseSchemaType,
  PromptResponseSchemaType,
};
