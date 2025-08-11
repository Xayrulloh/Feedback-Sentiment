import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  MistralResponseSchema,
  AIRequestSchemaDto,
  AIResponseSchemaType,
  AIResponseSchema,
  PromptResponseSchemaType,
} from './dto/AI.dto';
import { generateSentimentPrompt } from './prompts/sentiment.prompt';
import { EnvType } from 'src/config/env/env-validation';

@Injectable()
export class AIService {
  private MISTRAL_API_KEY: string;

  constructor(protected configService: ConfigService) {
    this.MISTRAL_API_KEY  =
      configService.getOrThrow<EnvType['MISTRAL_API_KEY']>('MISTRAL_API_KEY');
  }

  private async sendPrompt(
    prompt: string,
    model: string = 'mistral-large-latest',
  ): Promise<PromptResponseSchemaType> {

    const { data } = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    const validatedResponse = MistralResponseSchema.parse(data);
    const content = validatedResponse.choices[0].message.content;

    return JSON.parse(content);
  }

  async analyzeOne(feedback: string): Promise<AIResponseSchemaType> {
    const prompt = generateSentimentPrompt(feedback);
    const jsonResponse = await this.sendPrompt(prompt);
  
    const parsed = AIResponseSchema.parse(jsonResponse);
  
    return {
      ...parsed,
      content: feedback, 
    };
  }

  async analyzeMany(input: AIRequestSchemaDto): Promise<AIResponseSchemaType[]> {
    const promises = input.feedbacks.map((feedback) => this.analyzeOne(feedback));

    return Promise.all(promises);
  }
}
