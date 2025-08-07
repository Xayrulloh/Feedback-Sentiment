// src/ai/test/ai-test.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from '../ai.service';
import { FeedbackSentiment } from '../dto/ai.dto';

// DTOs for request validation
class AnalyzeFeedbackDto {
  feedback: string;
}

class AnalyzeFeedbacksDto {
  feedbacks: string[];
}

@Controller('test/ai')
export class AiTestController {
  constructor(private readonly aiService: AiService) {}

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async analyzeSingleFeedback(
    @Body() body: AnalyzeFeedbackDto,
  ): Promise<{
    success: boolean;
    data: FeedbackSentiment;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const result = await this.aiService.analyzeOne(body.feedback);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          sentiment: 'unknown',
          confidence: 0,
          summary: `Error: ${error.message}`,
        },
        processingTime: Date.now() - startTime,
      };
    }
  }

  @Post('feedbacks')
  @HttpCode(HttpStatus.OK)
  async analyzeManyFeedbacks(
    @Body() body: AnalyzeFeedbacksDto,
  ): Promise<{
    success: boolean;
    data: FeedbackSentiment[];
    count: number;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const results = await this.aiService.analyzeMany(body.feedbacks);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: results,
        count: results.length,
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

}