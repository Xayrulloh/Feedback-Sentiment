// src/ai/dto/ai.dto.ts

import { z } from 'zod';

export const AnalyzeFeedbacksDtoSchema = z.object({
  feedbacks: z.array(z.string().min(1)),
});

export type AnalyzeFeedbacksDto = z.infer<typeof AnalyzeFeedbacksDtoSchema>;

export const FeedbackSentimentSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative', 'unknown']),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
});

export type FeedbackSentiment = z.infer<typeof FeedbackSentimentSchema>;
