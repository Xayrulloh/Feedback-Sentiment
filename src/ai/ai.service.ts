// src/ai/ai.service.ts

import { Injectable } from '@nestjs/common';
import { AiClient } from './ai.client';
import { generateSentimentPrompt } from './prompts/sentiment.prompt';
import {
  FeedbackSentiment,
  FeedbackSentimentSchema,
} from './dto/ai.dto';

@Injectable()
export class AiService {
  constructor(private readonly client: AiClient) {}

  async analyzeOne(feedback: string): Promise<FeedbackSentiment> {
    const prompt = generateSentimentPrompt(feedback);
    const raw = await this.client.sendPrompt(prompt);
    return this.parseResponse(raw);
  }

  async analyzeMany(feedbacks: string[]): Promise<FeedbackSentiment[]> {
    const promises = feedbacks.map(feedback => this.analyzeOne(feedback));
    return Promise.all(promises);
  }

  private parseResponse(response: string): FeedbackSentiment {
    const sentimentMatch = response.match(/Sentiment:\s*(positive|neutral|negative|unknown)/i);
    const confidenceMatch = response.match(/Confidence:\s*(\d+)/i);
    const summaryMatch = response.match(/Summary:\s*(.+)/i);

    const parsed = {
      sentiment: (sentimentMatch?.[1]?.toLowerCase() ?? 'unknown') as FeedbackSentiment['sentiment'],
      confidence: Number(confidenceMatch?.[1] ?? 0),
      summary: summaryMatch?.[1]?.trim() ?? 'No summary',
    };

    return FeedbackSentimentSchema.parse(parsed);
  }
}