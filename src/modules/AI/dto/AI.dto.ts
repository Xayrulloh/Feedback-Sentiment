import { createZodDto } from 'nestjs-zod';
import { FeedbackManualRequestSchema } from 'src/modules/feedback/dto/feedback.dto';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

const AIRequestSchema = FeedbackManualRequestSchema;

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
  content: true,
});

const PromptResponseSchema = AIResponseSchema.omit({ content: true });

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
