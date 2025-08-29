import { createZodDto } from 'nestjs-zod';
import { FeedbackManualRequestSchema } from 'src/modules/feedback/dto/feedback.dto';
import { FeedbackSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

/**
 * AI request schema.
 * Reuses manual feedback request structure as the input for AI.
 */
const AIRequestSchema = FeedbackManualRequestSchema;

/**
 * Schema for a raw response coming from Mistral API.
 * Contains an array of choices, each with a message and content.
 */
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

/**
 * AI response schema.
 * Extracted subset of feedback fields that AI provides:
 * sentiment, confidence, summary, and the original content.
 */
const AIResponseSchema = FeedbackSchema.pick({
  sentiment: true,
  confidence: true,
  summary: true,
  content: true,
});

/**
 * Prompt response schema.
 * Same as AIResponseSchema, but omits the original content field.
 * Useful when showing only the processed AI output.
 */
const PromptResponseSchema = AIResponseSchema.omit({ content: true });

/**
 * DTOs inferred from schemas.
 */
class AIRequestDto extends createZodDto(AIRequestSchema) {}
class MistralResponseDto extends createZodDto(MistralResponseSchema) {}
class AIResponseDto extends createZodDto(AIResponseSchema) {}
class PromptResponseDto extends createZodDto(PromptResponseSchema) {}

/**
 * Unified export block — only schemas and DTOs.
 */
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
