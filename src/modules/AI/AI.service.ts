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
import { SENTIMENT_SYSTEM_PROMPT } from './prompts/sentiment.prompt';

@Injectable()
export class AIService {
  private MISTRAL_API_KEY: string;

  constructor(protected configService: ConfigService) {
    this.MISTRAL_API_KEY =
      configService.getOrThrow<EnvType['MISTRAL_API_KEY']>('MISTRAL_API_KEY');
  }

  private async sendPrompt(
    feedback: string,
    model: string = 'mistralai/mistral-7b-instruct',
  ): Promise<PromptResponseDto> {
    const { data } = await axios
      .post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
            { role: 'user', content: feedback },
          ],
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

    const parsed = MistralResponseSchema.safeParse(data);

    if (!parsed.success) {
      const issues = parsed.error.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      Logger.error(
        `Invalid Mistral API response: ${JSON.stringify(issues)}`,
        AIService.name,
      );

      throw new InternalServerErrorException({
        message: 'Invalid response from Mistral API',
        errors: issues,
      });
    }

    const content = parsed.data.choices[0].message.content;

    return JSON.parse(content);
  }

  async analyzeOne(feedback: string): Promise<AIResponseDto> {
    const jsonResponse = await this.sendPrompt(feedback);
    const parsed = PromptResponseSchema.safeParse(jsonResponse);

    if (!parsed.success) {
      const issues = parsed.error.errors.map((issue) => ({
        field: issue.path.length ? issue.path.join('.') : 'root',
        message: issue.message,
        code: issue.code,
      }));

      Logger.error(
        `Invalid prompt response: ${JSON.stringify(issues)}`,
        AIService.name,
      );

      throw new InternalServerErrorException({
        message: 'Invalid response from AI prompt',
        errors: issues,
      });
    }

    return {
      ...parsed.data,
      content: feedback,
    };
  }

  async analyzeMany(input: AIRequestDto): Promise<AIResponseDto[]> {
    return await Promise.all(
      input.feedbacks.map((feedback) => this.analyzeOne(feedback)),
    );
  }
}
