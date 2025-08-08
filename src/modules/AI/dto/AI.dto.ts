import { FeedbackSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

const AIRequestSchema = z.object({
  feedbacks: z.array(z.string().min(3)),
});

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

const AIResponseSchema = FeedbackSchema.pick({
  sentiment: true,
  confidence: true,
  summary: true,
})

type AIRequestSchemaDto = z.infer<typeof AIRequestSchema>;
type MistralResponse = z.infer<typeof MistralResponseSchema>;
type AIResponseSchemaType = z.infer<typeof AIResponseSchema>;

export {
  AIRequestSchema,
  AIResponseSchema,
  MistralResponseSchema,
};

export type { AIRequestSchemaDto, MistralResponse, AIResponseSchemaType };
