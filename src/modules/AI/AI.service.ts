import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosError } from 'axios';
import type { EnvType } from 'src/config/env/env-validation';
import {
  AIRequestDto,
  AIResponseDto,
  MistralResponseSchema,
  PromptResponseDto,
  PromptResponseSchema,
} from './dto/AI.dto';
import { generateSentimentPrompt } from './prompts/sentiment.prompt';

// Give proper Scopes to inject
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
  ): Promise<PromptResponseDto> {
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

    // FIXME: use zod safeParse and throw meaningful error
    const validatedResponse = MistralResponseSchema.parse(data);
    const content = validatedResponse.choices[0].message.content;

    return JSON.parse(content);
  }

  async analyzeOne(feedback: string): Promise<AIResponseDto> {
    const prompt = generateSentimentPrompt(feedback);
    const jsonResponse = await this.sendPrompt(prompt);

    // FIXME: use zod safeParse and throw meaningful error
    const parsed = PromptResponseSchema.parse(jsonResponse);

    return {
      ...parsed,
      content: feedback,
    };
  }

  async analyzeMany(input: AIRequestDto): Promise<AIResponseDto[]> {
    const promises = input.feedbacks.map((feedback) =>
      this.analyzeOne(feedback),
    );

    // FIXME: Use safer promise all
    return Promise.all(promises);
  }
}
