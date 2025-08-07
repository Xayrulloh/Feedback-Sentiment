import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface MistralResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string; type: string; code?: string };
}

@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY ?? '';
    this.endpoint = 'https://api.mistral.ai/v1/chat/completions';

    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY is not defined in environment variables');
    }
  }

  async sendPrompt(prompt: string, model = 'mistral-large-latest'): Promise<string> {
    try {
      const res = await axios.post<MistralResponse>(
        this.endpoint,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000, // 10-second timeout
        },
      );

      const content = res.data.choices?.[0]?.message?.content;
      if (!content) {
        this.logger.error('Unexpected API response structure', JSON.stringify(res.data, null, 2));
        throw new Error('Invalid response from Mistral API: No content found');
      }

      return content;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
        this.logger.error(
          `Mistral API request failed: ${errorMessage} (Code: ${errorCode})`,
          JSON.stringify(error.response?.data, null, 2),
        );
        throw new Error(`Failed to fetch response from Mistral API: ${errorMessage}`);
      }
      this.logger.error('Unexpected error in Mistral API request', error);
      throw error;
    }
  }
}