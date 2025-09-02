import { createZodDto } from 'nestjs-zod';
import { FeedbackManualRequestSchema } from 'src/modules/feedback/dto/feedback.dto';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

// Feedbacks request data for ai
const AIRequestSchema = FeedbackManualRequestSchema.describe(
  'Feedbacks request data for ai',
);

//Response coming from Mistrak Ai
const MistralResponseSchema = z
  .object({
    choices: z
      .array(
        z.object({
          message: z.object({
            content: z.string(),
          }),
        }),
      )
      .min(1),
  })
  .describe('Response coming from Mistral Ai');

// Structured response data coming from ai
const AIResponseSchema = FeedbackSchema.pick({
  sentiment: true,
  confidence: true,
  summary: true,
  content: true,
}).describe('Structured response data coming from ai');

// Response data from prompt
const PromptResponseSchema = AIResponseSchema.omit({ content: true }).describe(
  'Response data from prompt',
);

class AIRequestDto extends createZodDto(AIRequestSchema) {}
class MistralResponseDto extends createZodDto(MistralResponseSchema) {}
class AIResponseDto extends createZodDto(AIResponseSchema) {}
class PromptResponseDto extends createZodDto(PromptResponseSchema) {}

export {
  AIRequestSchema,
  AIResponseSchema,
  MistralResponseSchema,
  PromptResponseSchema,
  AIRequestDto,
  MistralResponseDto,
  AIResponseDto,
  PromptResponseDto,
};
