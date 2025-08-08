import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MistralResponseSchema, FeedbackSentiment, FeedbackSentimentSchema } from './dto/ai.dto';
import { generateSentimentPrompt } from './prompts/sentiment.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  private async sendPrompt(prompt: string, model?: string): Promise<unknown> {
    const apiKey = this.configService.get('MISTRAL_API_KEY');
    const endpoint = this.configService.get('MISTRAL_API_URL');
    const defaultModel = this.configService.get('AI_MODEL');

    const { data } = await axios.post(
      endpoint,
      {
        model: model ?? defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    const validatedResponse = MistralResponseSchema.parse(data);
    const content = validatedResponse.choices[0].message.content;

    return JSON.parse(content);
  }

  async analyzeOne(feedback: string): Promise<FeedbackSentiment> {
    const prompt = generateSentimentPrompt(feedback);
    const jsonResponse = await this.sendPrompt(prompt);
    return FeedbackSentimentSchema.parse(jsonResponse);
  }

  async analyzeMany(feedbacks: string[]): Promise<FeedbackSentiment[]> {
    const promises = feedbacks.map(feedback => this.analyzeOne(feedback));
    return Promise.all(promises);
  }
}