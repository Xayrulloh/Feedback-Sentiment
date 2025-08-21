import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosError } from 'axios';
import type { EnvType } from 'src/config/env/env-validation';
import {
  type AIRequestSchemaDto,
  type AIResponseSchemaType,
  MistralResponseSchema,
  PromptResponseSchema,
  type PromptResponseSchemaType,
} from './dto/AI.dto';
import { generateSentimentPrompt } from './prompts/sentiment.prompt';

@Injectable()
export class AIService {
  private MISTRAL_API_KEY: string;

  constructor(protected configService: ConfigService) {
    this.MISTRAL_API_KEY =
      configService.getOrThrow<EnvType['MISTRAL_API_KEY']>('MISTRAL_API_KEY');
  }

  private async sendPrompt(
    prompt: string,
    model: string = 'mistralai/mistral-7b-instruct',
  ): Promise<PromptResponseSchemaType> {
    const { data } = await axios
      .post(
        'https://openrouter.ai/api/v1/chat/completions',
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
      )
      .catch((err: AxiosError) => {
        Logger.error(err, AIService.name);

        throw new InternalServerErrorException('Error while sending prompt');
      });

    const validatedResponse = MistralResponseSchema.parse(data);
    const content = validatedResponse.choices[0].message.content;

    return JSON.parse(content);
  }

  async analyzeOne(feedback: string): Promise<AIResponseSchemaType> {
    const prompt = generateSentimentPrompt(feedback);
    const jsonResponse = await this.sendPrompt(prompt);

    const parsed = PromptResponseSchema.parse(jsonResponse);

    return {
      ...parsed,
      content: feedback,
    };
  }

  async analyzeMany(
    input: AIRequestSchemaDto,
  ): Promise<AIResponseSchemaType[]> {
    const promises = input.feedbacks.map((feedback) =>
      this.analyzeOne(feedback),
    );

    return Promise.all(promises);
  }
}
