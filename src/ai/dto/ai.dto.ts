import { z } from 'zod';

export const AnalyzeFeedbacksDtoSchema = z.object({
  feedbacks: z.array(z.string().min(2)),
});

export const MistralResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    })
  ).min(1),
});

export const FeedbackSentimentSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative', 'unknown']),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
});

export type AnalyzeFeedbacksDto = z.infer<typeof AnalyzeFeedbacksDtoSchema>;
export type MistralResponse = z.infer<typeof MistralResponseSchema>;
export type FeedbackSentiment = z.infer<typeof FeedbackSentimentSchema>;
